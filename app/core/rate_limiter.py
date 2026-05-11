import time
from app.core.redis_client import redis_client

async def is_rate_limited(key_id: int, limit: int) -> bool:
    now = time.time()
    window = 60
    redis_key = f"ratelimit:{key_id}"
    pipe = redis_client.pipeline()
    pipe.zremrangebyscore(redis_key, 0, now - window)
    pipe.zadd(redis_key, {str(now): now})
    pipe.zcard(redis_key)
    pipe.expire(redis_key, window + 1)
    results = await pipe.execute()
    return results[2] > limit