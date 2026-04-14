locals {
  discord_webhook_parameter_name = (
    var.discord_webhook_parameter_name != null
    ? var.discord_webhook_parameter_name
    : "/${var.project}/discord-webhook-url"
  )
  discord_webhook_parameter_arn = "arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${startswith(local.discord_webhook_parameter_name, "/") ? local.discord_webhook_parameter_name : "/${local.discord_webhook_parameter_name}"}"

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
