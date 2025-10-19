import logging
import boto3
from boto3.dynamodb.conditions import Key
class NoContextService:
  def query_orders(self, status:str):
    """特定のステータスに一致するすべての注文を取得するメソッド"""
    # DynamoDBデータベースクライアントを取得
    ddb = boto3.client(("dynamodb"))

    # 特定のステータスに一致する注文を取得する
    logging.info(("Querying orders with the status of %s", status))
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
    
