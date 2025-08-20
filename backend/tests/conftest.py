import pytest
import asyncio
from httpx import AsyncClient
from src.main import app

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client():
    """Create a test client for the Flask app."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def mock_user_token():
    """Mock JWT token for authenticated requests."""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_token"

@pytest.fixture
def mock_admin_token():
    """Mock JWT token for admin requests."""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin_token"

@pytest.fixture
def auth_headers(mock_user_token):
    """Headers with authentication token."""
    return {"Authorization": f"Bearer {mock_user_token}"}

@pytest.fixture
def admin_headers(mock_admin_token):
    """Headers with admin authentication token."""
    return {"Authorization": f"Bearer {mock_admin_token}"}

@pytest.fixture
def sample_lead_data():
    """Sample lead data for testing."""
    return {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "+1234567890",
        "source": "FACEBOOK_COMMENT",
        "consentGiven": True
    }

@pytest.fixture
def sample_campaign_data():
    """Sample campaign data for testing."""
    return {
        "name": "Test Campaign",
        "description": "A test campaign",
        "type": "WHATSAPP_TEMPLATE",
        "templateId": "welcome_template",
        "audienceFilters": {
            "status": "NEW",
            "consent_only": True
        }
    }

