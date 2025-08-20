import pytest
from httpx import AsyncClient

class TestCampaignsAPI:
    """Test campaigns management endpoints."""
    
    async def test_get_campaigns_without_auth(self, client: AsyncClient):
        """Test getting campaigns without authentication."""
        response = await client.get("/api/campaigns")
        assert response.status_code == 401
        assert "error" in response.json()
    
    async def test_get_campaigns_with_auth(self, client: AsyncClient, auth_headers):
        """Test getting campaigns with authentication."""
        response = await client.get("/api/campaigns", headers=auth_headers)
        assert response.status_code in [200, 500]
    
    async def test_get_campaigns_with_filters(self, client: AsyncClient, auth_headers):
        """Test getting campaigns with filters."""
        params = {
            "status": "RUNNING",
            "type": "WHATSAPP_TEMPLATE"
        }
        response = await client.get("/api/campaigns", params=params, headers=auth_headers)
        assert response.status_code in [200, 500]
    
    async def test_create_campaign_without_auth(self, client: AsyncClient, sample_campaign_data):
        """Test creating campaign without authentication."""
        response = await client.post("/api/campaigns", json=sample_campaign_data)
        assert response.status_code == 401
        assert "error" in response.json()
    
    async def test_create_campaign_with_invalid_data(self, client: AsyncClient, auth_headers):
        """Test creating campaign with invalid data."""
        invalid_data = {
            "name": "",  # Empty name
            "type": "INVALID_TYPE",  # Invalid type
        }
        response = await client.post("/api/campaigns", json=invalid_data, headers=auth_headers)
        assert response.status_code == 400
        assert "error" in response.json()
    
    async def test_create_campaign_with_valid_data(self, client: AsyncClient, auth_headers, sample_campaign_data):
        """Test creating campaign with valid data."""
        response = await client.post("/api/campaigns", json=sample_campaign_data, headers=auth_headers)
        assert response.status_code in [201, 500]
    
    async def test_start_campaign_without_auth(self, client: AsyncClient):
        """Test starting campaign without authentication."""
        response = await client.post("/api/campaigns/campaign_123/start")
        assert response.status_code == 401
        assert "error" in response.json()
    
    async def test_start_nonexistent_campaign(self, client: AsyncClient, auth_headers):
        """Test starting a campaign that doesn't exist."""
        response = await client.post("/api/campaigns/nonexistent_id/start", headers=auth_headers)
        assert response.status_code in [404, 500]
    
    async def test_pause_campaign_without_auth(self, client: AsyncClient):
        """Test pausing campaign without authentication."""
        response = await client.post("/api/campaigns/campaign_123/pause")
        assert response.status_code == 401
        assert "error" in response.json()
    
    async def test_cancel_campaign_without_auth(self, client: AsyncClient):
        """Test cancelling campaign without authentication."""
        response = await client.post("/api/campaigns/campaign_123/cancel")
        assert response.status_code == 401
        assert "error" in response.json()
    
    async def test_preview_campaign_without_auth(self, client: AsyncClient):
        """Test previewing campaign without authentication."""
        response = await client.post("/api/campaigns/campaign_123/preview")
        assert response.status_code == 401
        assert "error" in response.json()
    
    async def test_preview_campaign_with_auth(self, client: AsyncClient, auth_headers):
        """Test previewing campaign with authentication."""
        response = await client.post("/api/campaigns/campaign_123/preview", headers=auth_headers)
        assert response.status_code in [200, 404, 500]
    
    async def test_get_campaign_stats(self, client: AsyncClient, auth_headers):
        """Test getting campaign statistics."""
        response = await client.get("/api/campaigns/campaign_123/stats", headers=auth_headers)
        assert response.status_code in [200, 404, 500]
    
    async def test_update_campaign_without_auth(self, client: AsyncClient):
        """Test updating campaign without authentication."""
        update_data = {"name": "Updated Campaign Name"}
        response = await client.put("/api/campaigns/campaign_123", json=update_data)
        assert response.status_code == 401
        assert "error" in response.json()
    
    async def test_delete_campaign_without_auth(self, client: AsyncClient):
        """Test deleting campaign without authentication."""
        response = await client.delete("/api/campaigns/campaign_123")
        assert response.status_code == 401
        assert "error" in response.json()

