# NexoCloud

NexoCloud es una plataforma empresarial orientada al registro de usuarios y almacenamiento seguro de archivos en la nube, diseñada con una arquitectura cloud sobre AWS.

## Arquitectura

El proyecto está estructurado utilizando una arquitectura por capas:

- **Frontend**: Desarrollado con React. Permite a los usuarios interactuar con el sistema (Login, Registro, Dashboard, Gestión de Archivos).
- **Backend**: Desarrollado con FastAPI (Python). Expone una API REST para gestionar la lógica de negocio, autenticación, y comunicación con S3 y PostgreSQL.
- **Base de Datos**: PostgreSQL para almacenar información estructurada de usuarios y metadatos de archivos.
- **Almacenamiento de Archivos**: Amazon S3.
- **Servidor Web / Proxy**: Nginx.

## Estructura del Repositorio

- `/frontend`: Contiene la aplicación web construida en React.
- `/backend`: Contiene la API REST construida con FastAPI.
- `docker-compose.yml`: Orquestador local para levantar frontend, backend y la base de datos de manera simultánea en el entorno de desarrollo.

## Despliegue con Docker

El proyecto está preparado para ser dockerizado y desplegado en entornos cloud (AWS). 

### Dockerfiles Individuales
Cada componente (Frontend y Backend) tiene su propio `Dockerfile` ubicado en su respectiva carpeta. Esto facilita la creación de imágenes independientes para subirlas a repositorios como Amazon ECR y desplegarlas en servicios como EC2, ECS o EKS de manera aislada, permitiendo el escalamiento independiente de cada capa.

### Desarrollo Local (Docker Compose)
Para propósitos de desarrollo local, se provee un archivo `docker-compose.yml` en la raíz del proyecto. Este archivo orquesta los distintos contenedores simulando la infraestructura cloud.

Para levantar el entorno completo en tu máquina:

```bash
docker-compose up --build
```
