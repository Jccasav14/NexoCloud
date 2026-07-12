import urllib.parse
import json

def handler(event, context):
    print("=== NexoCloud Auto-Processor Lambda Triggered ===")
    
    # Check if event is from EventBridge CloudWatch Alarm
    if event.get("source") == "aws.monitoring" and event.get("detail-type") == "CloudWatch Alarm State Change":
        detail = event.get("detail", {})
        alarm_name = detail.get("alarmName", "Unknown")
        state_value = detail.get("state", {}).get("value", "Unknown")
        reason = detail.get("state", {}).get("reason", "No reason provided")
        
        print(f"[ALARM STATE CHANGE] Alarm '{alarm_name}' transitioned to state: {state_value}")
        print(f"Reason: {reason}")
        
    # Check if event is from EventBridge Scheduled Event
    elif event.get("source") == "aws.events" and event.get("detail-type") == "Scheduled Event":
        print(f"[SCHEDULED TASK] Executing scheduled maintenance / log rotation task.")
        print(f"Event ID: {event.get('id')}")
        print(f"Time: {event.get('time')}")
        
    else:
        print("Received general or unhandled event:")
        print(json.dumps(event, indent=2))
        
    print("=== Execution Finished successfully ===")
    return {
        "statusCode": 200,
        "body": "Event processed successfully"
    }
