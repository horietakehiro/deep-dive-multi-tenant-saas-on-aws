import logging
import boto3
from boto3.dynamodb.conditions import Key
def query_orders(request, status):
  """特定のステータスに一致するすべての注文を取得するメソッド"""
  # リクエストからテナントコンテキストを取得する
  tenant_context = get_tenant_context(request)

  # スコープが絞られえたデータベースクライアントを取得する
  ddb = get_scoped_client(tenant_context, policy)

  # 特定のステータスに一致する注文を取得する
  log_helper.info(
    request, "Find order with the status of %s", status
  )
  try:
    response = get_orders(ddb, tenant_context, status)
  except ddb.exceptions.ClientError as err:
    log_helper.error((
      "Find order error, status %s. Info: %s: %s",
      status,
      err.response["Error"]["Code"],
      err.response["Error"]["Message"],
    ))
    raise
  else:
    return response["Items"]
  
