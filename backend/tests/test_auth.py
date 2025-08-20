import pytest
from httpx import AsyncClient

class TestAuthentication:
    """Test authentication endpoints."""
    
    async def test_facebook_login_redirect(self, client: AsyncClient):
        """Test Facebook OAuth login redirect."""
        response = await client.get("/api/auth/facebook/login")
        assert response.status_code == 302
        assert "facebook.com" in response.headers["location"]
    
    async def test_get_current_user_without_token(self, client: AsyncClient):
        """Test getting current user without authentication token."""
        response = await client.get("/api/auth/me")
        assert response.status_code == 401
        assert "error" in response.json()
    
    async def test_get_current_user_with_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/api/auth/me", headers=headers)
        assert response.status_code == 401
        assert "error" in response.json()
    
    @pytest.mark.asyncio
    async def test_facebook_callback_without_code(self, client: AsyncClient):
        """Test Facebook OAuth callback without authorization code."""
        response = await client.get("/api/auth/facebook/callback")
        assert response.status_code == 400
        assert "error" in response.json()
    
    @pytest.mark.asyncio
    async def test_facebook_callback_with_error(self, client: AsyncClient):
        """Test Facebook OAuth callback with error parameter."""
        response = await client.get("/api/auth/facebook/callback?error=access_denied")
        assert response.status_code == 400
        assert "error" in response.json()
        assert "access_denied" in response.json()["error"]

