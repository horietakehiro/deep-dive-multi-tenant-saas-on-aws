import logging
import time
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
    # DynamoDBデータベースクライアントを取得
    ddb = boto3.client(("dynamodb"))

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
    try:
      start_time = time.time()
      response = ddb.query(
        TableName=get_tenant_order_table_name((tenant_id, tenant_tier)),
        KeyConditionExpression=Key("status").eq(status),
        FilterExpression=
      )
      duration = (time.time() - start_time)
      message = {
        "tenantId": tenant_id, "tier": tenant_tier,
        "service": "order",
        "operation": "query_orders",
        "duration": duration,
      }
      firehose = boto3.client("firehose")
      firehose.put_record(
        DeliveryName="saas_metrics",
        Record=message
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
    
def get_tenant_order_table_name(tenant_id: str, tenant_tier:str):
  if tenant_tier == "BASICT_TIER":
    table_name = "pooled_order_table"
  elif tenant_tier == "PREMIUM_TIER":
    table_name = "order_table_" + tenant_id
  return table_name