import logging
import os
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
    # テナントコンテキストを抽出する
    auth_header = request.headers.get("Authorization")
    token = auth_header.split((" "))
    if token[0] != "Bearer":
      raise Exception("No bearer token in request")
    bearer_token = token[1]
    decoded_jwt = jwt.decode(bearer_token, "secret", algorithms=["HS256"])
    tenant_id = decoded_jwt["tenantId"]
    tenant_tier = decoded_jwt["tenantTier"]

    # テナントにスコープが絞られえた資格情報を用いてデータベースクライアントを取得する
    sts = boto3.client("sts")
    # テナントスコープポリシーに基づいて資格情報を取得する
    tenant_credentials = sts.assume_role(
      RoleArn=os.environ["IDENTITY_ROLE"],
      RoleSessionName=tenant_id,
      Policy=scoped_policy,
      DurationSeconds=600,
    )

    # 指定したロールの資格情報を用いてスコープが絞られたセッションを取得する
    tenant_scoped_session = boto3.Session(
      aws_access_key_id=tenant_credentials["Credentials"]["AccessKeyId"],
      aws_secret_access_key=tenant_credentials["Credentials"]["SecretAccessKey"],
      aws_session_token=tenant_credentials["Credentials"]["SessionToken"],
    )

    # テナントスコープから絞られた資格情報を用いてデータベースクライアントを取得する
    ddb = tenant_scoped_session.client(("dynamodb"))

    
    # 特定のステータスに一致する注文を取得する
    logging.info(("Tenant: %s, Tier: %s, Querying orders with the status of %s",
                  tenant_id, tenant_tier, status))
    try:
      start_time = time.time()
      response = ddb.query(
        TableName="order_table",
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