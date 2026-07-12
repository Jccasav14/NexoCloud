# PostgreSQL Database EC2 Instance Configuration

# Fetch the latest Ubuntu 22.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (Ubuntu)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# DB EC2 Instance
resource "aws_instance" "db_instance" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t3.small"
  subnet_id                   = aws_subnet.private_1.id # Private subnet to restrict direct internet access
  vpc_security_group_ids      = [aws_security_group.db_sg.id]
  associate_public_ip_address = false
  key_name                    = var.key_name != "" ? var.key_name : null

  depends_on = [
    aws_route_table_association.private_1,
    aws_nat_gateway.nat
  ]


  root_block_device {
    volume_size           = 30 # 30 GB EBS as requested
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  # Bootstrap script to install and configure Postgres
  user_data = <<-EOF
              #!/bin/bash
              set -ex
              
              # Wait for apt lock
              sleep 10
              
              # Install PostgreSQL
              sudo apt-get update -y
              sudo apt-get install -y postgresql postgresql-contrib
              
              # Enable and start service
              sudo systemctl enable postgresql
              sudo systemctl start postgresql
              
              # Locate configuration files
              PG_VERSION=$(psql -V | awk '{print $3}' | cut -d. -f1)
              PG_CONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
              PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
              
              # If path not found, search dynamically
              if [ ! -f "$PG_CONF" ]; then
                PG_CONF=$(find /etc/postgresql/ -name postgresql.conf | head -n 1)
                PG_HBA=$(find /etc/postgresql/ -name pg_hba.conf | head -n 1)
              fi
              
              # Configure listening address
              sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"
              
              # Allow md5 password connections from backend CIDRs
              echo "host all all 10.0.0.0/16 md5" | sudo tee -a "$PG_HBA"
              
              # Restart postgres to apply configurations
              sudo systemctl restart postgresql
              
              # Setup databases and user
              sudo -u postgres psql -c "CREATE USER ${var.db_username} WITH PASSWORD '${var.db_password}';"
              sudo -u postgres psql -c "CREATE DATABASE ${var.db_name} OWNER ${var.db_username};"
              sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${var.db_name} TO ${var.db_username};"
              
              echo "PostgreSQL setup completed successfully."
              EOF

  tags = {
    Name = "${var.project_name}-db-instance"
  }
}
