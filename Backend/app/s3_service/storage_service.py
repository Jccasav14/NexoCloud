import os
import shutil
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

load_dotenv()

STORAGE_PROVIDER = os.getenv("STORAGE_PROVIDER", "local").lower()
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize S3 client only if provider is s3
s3_client = None
if STORAGE_PROVIDER == "s3":
    s3_kwargs = {"region_name": AWS_REGION}
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        s3_kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        s3_kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
        if AWS_SESSION_TOKEN:
            s3_kwargs["aws_session_token"] = AWS_SESSION_TOKEN
    
    s3_client = boto3.client("s3", **s3_kwargs)


def get_s3_client():
    global s3_client
    if s3_client is None:
        s3_kwargs = {"region_name": AWS_REGION}
        if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
            s3_kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
            s3_kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
            if AWS_SESSION_TOKEN:
                s3_kwargs["aws_session_token"] = AWS_SESSION_TOKEN
        s3_client = boto3.client("s3", **s3_kwargs)
    return s3_client


def save_file(upload_file: UploadFile, user_id: int) -> dict:
    """
    Saves a file either locally or uploads it to S3, depending on the STORAGE_PROVIDER.
    Returns a dict with {"path": str, "size": int, "content_type": str}
    """
    filename = upload_file.filename
    content_type = upload_file.content_type or "application/octet-stream"

    # Calculate file size without loading it entirely into memory
    upload_file.file.seek(0, os.SEEK_END)
    file_size = upload_file.file.tell()
    upload_file.file.seek(0)

    if STORAGE_PROVIDER == "s3":
        if not S3_BUCKET_NAME:
            raise HTTPException(
                status_code=500,
                detail="S3_BUCKET_NAME no está configurado en las variables de entorno."
            )
        
        s3_key = f"uploads/{user_id}/{filename}"
        
        try:
            client = get_s3_client()
            client.upload_fileobj(
                upload_file.file,
                S3_BUCKET_NAME,
                s3_key,
                ExtraArgs={"ContentType": content_type}
            )
            return {
                "path": s3_key,
                "size": file_size,
                "content_type": content_type
            }
        except ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al subir archivo a AWS S3: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error inesperado al subir a S3: {str(e)}"
            )
    else:
        # Local storage fallback
        user_dir = os.path.join(UPLOAD_DIR, str(user_id))
        os.makedirs(user_dir, exist_ok=True)
        file_path = os.path.join(user_dir, filename)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
            
            relative_path = f"uploads/{user_id}/{filename}"
            return {
                "path": relative_path,
                "size": file_size,
                "content_type": content_type
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al guardar el archivo localmente: {str(e)}"
            )


def delete_file(path_or_key: str) -> None:
    """
    Deletes a file either locally or from S3 depending on the STORAGE_PROVIDER.
    """
    if STORAGE_PROVIDER == "s3":
        if not S3_BUCKET_NAME:
            return
        try:
            client = get_s3_client()
            client.delete_object(Bucket=S3_BUCKET_NAME, Key=path_or_key)
        except ClientError as e:
            print(f"Error al eliminar objeto de S3: {str(e)}")
    else:
        file_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            path_or_key
        )
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Error al eliminar archivo local: {str(e)}")


def get_file_stream(path_or_key: str):
    """
    Returns a tuple (stream, content_type, filename) for streaming download.
    stream is a file-like object.
    """
    filename = os.path.basename(path_or_key)
    
    if STORAGE_PROVIDER == "s3":
        if not S3_BUCKET_NAME:
            raise HTTPException(
                status_code=500,
                detail="S3_BUCKET_NAME no está configurado."
            )
        try:
            client = get_s3_client()
            response = client.get_object(Bucket=S3_BUCKET_NAME, Key=path_or_key)
            return response["Body"], response.get("ContentType", "application/octet-stream"), filename
        except ClientError as e:
            if e.response['Error']['Code'] == "NoSuchKey":
                raise HTTPException(status_code=404, detail="El archivo no existe en S3.")
            raise HTTPException(status_code=500, detail=f"Error al descargar desde S3: {str(e)}")
    else:
        file_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            path_or_key
        )
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="El archivo no existe localmente.")
        
        # We try to infer the content type, otherwise fallback
        import mimetypes
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = "application/octet-stream"
            
        try:
            file_obj = open(file_path, "rb")
            return file_obj, content_type, filename
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al abrir el archivo local: {str(e)}")
