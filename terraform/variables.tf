variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "project" {
  description = "Project name used to prefix resources"
  type        = string
  default     = "snow-tracker"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "schedule_expression" {
  description = "EventBridge Scheduler cron expression for the alerts Lambda"
  type        = string
  default     = "cron(0 7 * * ? *)"
}

variable "discord_webhook_parameter_name" {
  description = "Name of an existing SSM SecureString parameter containing the Discord webhook URL"
  type        = string
  default     = null

  validation {
    condition     = var.discord_webhook_parameter_name == null ? true : length(var.discord_webhook_parameter_name) > 0
    error_message = "discord_webhook_parameter_name must be null or non-empty."
  }
}

variable "min_score" {
  description = "Minimum resort score that triggers an alert"
  type        = number
  default     = 8
}
