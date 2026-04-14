output "dynamodb_table_name" {
  value       = aws_dynamodb_table.alerts.name
  description = "Set as DYNAMODB_TABLE in your .env for local alerts runs"
}

output "lambda_function_name" {
  value       = aws_lambda_function.alerts.function_name
  description = "Invoke manually: aws lambda invoke --function-name <this> /tmp/out.json"
}

output "discord_webhook_parameter_name" {
  value       = local.discord_webhook_parameter_name
  description = "Existing SSM SecureString parameter containing the Discord webhook URL"
}
