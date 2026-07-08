# Security Groups for NexoCloud

# 1. Application Load Balancer Security Group
resource "aws_security_group" "alb_sg" {
  name        = "${var.project_name}-alb-sg"
  description = "Security group for application load balancer"
  vpc_id      = aws_vpc.main.id

  # Allow HTTP traffic
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS traffic (uncomment if SSL cert is configured)
  # ingress {
  #   from_port   = 443
  #   to_port     = 443
  #   protocol    = "tcp"
  #   cidr_blocks = ["0.0.0.0/0"]
  # }

  # Outbound rules - allow all
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }
}

# 2. Frontend Instances Security Group
resource "aws_security_group" "frontend_sg" {
  name        = "${var.project_name}-frontend-sg"
  description = "Security group for frontend EC2 instances"
  vpc_id      = aws_vpc.main.id

  # HTTP from ALB only
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # SSH for debugging (optional)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Change to your IP for production
  }

  # Outbound rules - allow all (needed to fetch docker images)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-frontend-sg"
  }
}

# 3. Backend Instances Security Group
resource "aws_security_group" "backend_sg" {
  name        = "${var.project_name}-backend-sg"
  description = "Security group for backend EC2 instances"
  vpc_id      = aws_vpc.main.id

  # Port 8000 from ALB only
  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # SSH for debugging
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Change to your IP for production
  }

  # Outbound rules - allow all (needed to pull images and access DB/S3)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-backend-sg"
  }
}

# 4. Database Instance Security Group
resource "aws_security_group" "db_sg" {
  name        = "${var.project_name}-db-sg"
  description = "Security group for PostgreSQL database instance"
  vpc_id      = aws_vpc.main.id

  # PostgreSQL port (5432) ONLY from Backend Security Group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend_sg.id]
  }

  # SSH for setup/debug
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Change to your IP for production
  }

  # Outbound rules - allow all (needed to install postgresql packages at launch)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-db-sg"
  }
}
