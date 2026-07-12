# Configuration Variables for NexoCloud Infrastructure
variable "aws_region" {
  description = "AWS Region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project to tag resources"
  type        = string
  default     = "nexocloud"
}

variable "db_username" {
  description = "Database administrator username"
  type        = string
  default     = "nexo_user"
}

variable "db_password" {
  description = "Database administrator password"
  type        = string
  default     = "nexo_password"
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "nexocloud_db"
}

variable "docker_username" {
  description = "Docker Hub username for container images"
  type        = string
  default     = "jccasav"
}

variable "key_name" {
  description = "Name of the SSH key pair to access EC2 instances (leave empty if not using key pair)"
  type        = string
  default     = ""
}
