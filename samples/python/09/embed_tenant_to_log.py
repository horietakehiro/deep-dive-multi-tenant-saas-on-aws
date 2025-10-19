import logging
from typing import Dict
import jwt
import boto3
from boto3.dynamodb.conditions import Key
class Request:
  headers:Dict[str, str] = {}
request = Request()

class NoContextService:
  def query_orders(self, status:str):
    """特定のステータスに一致するすべての注文を取得するメソッド"""
    # テナントコンテキストを抽出する
    auth_header = request.headers.get("Authorization")
    token = auth_header.split((" "))
    if token[0] != "Bearer":
      raise Exception("No bearer token in request")
    bearer_token = token[1]
    decoded_jwt = jwt.decode(bearer_token, "secret", algorithms=["HS256"])
    tenant_id = decoded_jwt["tenantId"]
    tenant_tier = decoded_jwt["tenantTier"]
    
    # 特定のステータスに一致する注文を取得する
    logging.info(("Tenant: %s, Tier: %s, Querying orders with the status of %s",
                  tenant_id, tenant_tier, status))

    # DynamoDBデータベースクライアントを取得
    ddb = boto3.client(("dynamodb"))

    try:
      response = ddb.query(
        TableName="order_table",
        KeyConditionExpression=Key("status").eq(status),
      )
    except ddb.exceptions.ClientError as err:
      logging.error((
        "Find order error, status %s. Info: %s: %s",
        status,
        err.response["Error"]["Code"],
        err.response["Error"]["Message"],
      ))
      raise
    else:
      return response["Items"]
    
