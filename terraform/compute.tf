# Compute Tier: ALB, Launch Templates, and Auto Scaling Groups (ASG)

# 2. Application Load Balancer
resource "aws_lb" "app_alb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# 3. Target Groups
resource "aws_lb_target_group" "frontend_tg" {
  name     = "${var.project_name}-frontend-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
}

resource "aws_lb_target_group" "backend_tg" {
  name     = "${var.project_name}-backend-tg"
  port     = 8000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
}

# 4. ALB Listeners & Rules
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app_alb.arn
  port              = "80"
  protocol          = "HTTP"

  # Default rule forwards to Frontend
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend_tg.arn
  }
}

# Listener rule to route API traffic to Backend
resource "aws_lb_listener_rule" "api_routing" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}


# 5. Launch Templates
resource "aws_launch_template" "frontend_lt" {
  name_prefix   = "${var.project_name}-frontend-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  key_name      = var.key_name != "" ? var.key_name : null

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.frontend_sg.id]
  }

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size           = 20 # 20 GB EBS as requested
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -ex
              sleep 10
              sudo apt-get update -y
              sudo apt-get install -y docker.io
              sudo systemctl start docker
              sudo systemctl enable docker
              
              # Run frontend docker image
              sudo docker run -d -p 80:80 --name frontend --restart always ${var.docker_username}/nexocloud-frontend:latest
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-frontend-instance"
    }
  }
}

resource "aws_launch_template" "backend_lt" {
  name_prefix   = "${var.project_name}-backend-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  key_name      = var.key_name != "" ? var.key_name : null

  iam_instance_profile {
    name = "LabInstanceProfile"
  }

  depends_on = [
    aws_instance.db_instance,
    aws_ssm_parameter.db_host,
    aws_ssm_parameter.db_user,
    aws_ssm_parameter.db_password,
    aws_ssm_parameter.db_name,
    aws_ssm_parameter.s3_bucket
  ]


  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.backend_sg.id]
  }

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size           = 20 # 20 GB EBS as requested
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  # Configures Backend and fetches DB and S3 settings from AWS SSM Parameter Store at launch
  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -ex
              sleep 10
              sudo apt-get update -y
              sudo apt-get install -y docker.io awscli
              sudo systemctl start docker
              sudo systemctl enable docker
              
              # Fetch configuration values dynamically from AWS SSM Parameter Store
              DB_HOST=$(aws ssm get-parameter --name "/${var.project_name}/database/host" --query "Parameter.Value" --output text --region ${var.aws_region})
              DB_USER=$(aws ssm get-parameter --name "/${var.project_name}/database/username" --query "Parameter.Value" --output text --region ${var.aws_region})
              DB_PASS=$(aws ssm get-parameter --name "/${var.project_name}/database/password" --with-decryption --query "Parameter.Value" --output text --region ${var.aws_region})
              DB_NAME=$(aws ssm get-parameter --name "/${var.project_name}/database/name" --query "Parameter.Value" --output text --region ${var.aws_region})
              S3_BUCKET=$(aws ssm get-parameter --name "/${var.project_name}/s3/bucket_name" --query "Parameter.Value" --output text --region ${var.aws_region})
              
              # Run backend docker image using SSM parameters
              sudo docker run -d -p 8000:8000 --name backend \
                -e DATABASE_URL=postgresql://$DB_USER:$DB_PASS@$DB_HOST:5432/$DB_NAME \
                -e STORAGE_PROVIDER=s3 \
                -e S3_BUCKET_NAME=$S3_BUCKET \
                -e AWS_REGION=${var.aws_region} \
                --restart always ${var.docker_username}/nexocloud-backend:latest
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-backend-instance"
    }
  }
}


# 6. Auto Scaling Groups
# Desired capacities are set to 1 by default (total of 2 t3.micro instances) to save credits.
# Can be easily scaled up by editing the desired_capacity to 2 (total 4 instances).
resource "aws_autoscaling_group" "frontend_asg" {
  name_prefix         = "${var.project_name}-frontend-asg-"
  desired_capacity    = 1
  min_size            = 1
  max_size            = 2
  target_group_arns   = [aws_lb_target_group.frontend_tg.arn]
  vpc_zone_identifier = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  launch_template {
    id      = aws_launch_template.frontend_lt.id
    version = "$Latest"
  }

  health_check_type         = "ELB"
  health_check_grace_period = 300

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "backend_asg" {
  name_prefix         = "${var.project_name}-backend-asg-"
  desired_capacity    = 1
  min_size            = 1
  max_size            = 2
  target_group_arns   = [aws_lb_target_group.backend_tg.arn]
  vpc_zone_identifier = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  launch_template {
    id      = aws_launch_template.backend_lt.id
    version = "$Latest"
  }

  health_check_type         = "ELB"
  health_check_grace_period = 300

  lifecycle {
    create_before_destroy = true
  }
}
