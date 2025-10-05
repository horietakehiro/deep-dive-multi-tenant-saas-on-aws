import jwt
def get_tenant_context(request):
  auth_header = request.headers.get("Authorization")
  token = auth_header.split(" ")
  if token[0] != "Bearer":
    raise Exception("No bearer token in request")
  bearer_token = token[1]
  decoded_jwt = jwt.decode(bearer_token, "secret", algorithms=["HS256"])
  tenant_context = {
    "TenantId": decoded_jwt["tenantId"],
    "Tier": decoded_jwt["tenantTier"]
  }
  return tenant_context