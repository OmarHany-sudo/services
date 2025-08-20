from datetime import datetime
from src.models import Prisma
from src.utils.security import get_client_ip, get_user_agent

prisma = Prisma()

async def log_action(user_id=None, action=None, resource=None, resource_id=None, details=None):
    """Log an action for audit purposes"""
    try:
        await prisma.auditlog.create(
            data={
                'userId': user_id,
                'action': action,
                'resource': resource,
                'resourceId': resource_id,
                'details': details,
                'ipAddress': get_client_ip(),
                'userAgent': get_user_agent(),
                'createdAt': datetime.utcnow()
            }
        )
    except Exception as e:
        # Log to system logger if database logging fails
        print(f"Failed to log audit action: {str(e)}")

async def get_audit_logs(user_id=None, resource=None, limit=100, offset=0):
    """Get audit logs with optional filtering"""
    try:
        where_clause = {}
        if user_id:
            where_clause['userId'] = user_id
        if resource:
            where_clause['resource'] = resource
        
        logs = await prisma.auditlog.find_many(
            where=where_clause,
            order_by={'createdAt': 'desc'},
            take=limit,
            skip=offset,
            include={'user': True}
        )
        
        return logs
    except Exception as e:
        print(f"Failed to get audit logs: {str(e)}")
        return []

