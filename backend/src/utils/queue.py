import os
import redis
from bullmq import Queue, Worker
import json
from datetime import datetime, timedelta

# Redis connection
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    decode_responses=True
)

# Message queues
message_queue = None
import_queue = None

def init_queue():
    """Initialize message queues"""
    global message_queue, import_queue
    
    try:
        message_queue = Queue('message-queue', connection=redis_client)
        import_queue = Queue('import-queue', connection=redis_client)
        print("Message queues initialized successfully")
    except Exception as e:
        print(f"Failed to initialize queues: {str(e)}")

async def add_message_job(job_data):
    """Add a message sending job to the queue"""
    try:
        if not message_queue:
            init_queue()
        
        job = await message_queue.add('send-message', job_data, {
            'attempts': 3,
            'backoff': {
                'type': 'exponential',
                'delay': 2000,
            },
            'removeOnComplete': 100,
            'removeOnFail': 50
        })
        
        return job.id
    except Exception as e:
        print(f"Failed to add message job: {str(e)}")
        return None

async def add_import_job(job_data):
    """Add a data import job to the queue"""
    try:
        if not import_queue:
            init_queue()
        
        job = await import_queue.add('import-data', job_data, {
            'attempts': 2,
            'backoff': {
                'type': 'fixed',
                'delay': 5000,
            },
            'removeOnComplete': 50,
            'removeOnFail': 25
        })
        
        return job.id
    except Exception as e:
        print(f"Failed to add import job: {str(e)}")
        return None

async def schedule_message(message_data, send_at):
    """Schedule a message to be sent at a specific time"""
    try:
        if not message_queue:
            init_queue()
        
        delay = int((send_at - datetime.utcnow()).total_seconds() * 1000)
        if delay < 0:
            delay = 0
        
        job = await message_queue.add('send-message', message_data, {
            'delay': delay,
            'attempts': 3,
            'backoff': {
                'type': 'exponential',
                'delay': 2000,
            }
        })
        
        return job.id
    except Exception as e:
        print(f"Failed to schedule message: {str(e)}")
        return None

def get_queue_stats():
    """Get queue statistics"""
    try:
        stats = {}
        
        if message_queue:
            stats['message_queue'] = {
                'waiting': message_queue.count(),
                'active': len(message_queue.get_active()),
                'completed': len(message_queue.get_completed()),
                'failed': len(message_queue.get_failed())
            }
        
        if import_queue:
            stats['import_queue'] = {
                'waiting': import_queue.count(),
                'active': len(import_queue.get_active()),
                'completed': len(import_queue.get_completed()),
                'failed': len(import_queue.get_failed())
            }
        
        return stats
    except Exception as e:
        print(f"Failed to get queue stats: {str(e)}")
        return {}

