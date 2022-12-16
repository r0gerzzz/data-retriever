import os
import random
import json
import gevent
from locust.env import Environment
from locust.stats import stats_printer, stats_history
from locust.log import setup_logging
from locust import TaskSet, constant, HttpUser, task

from upi.configuration.OnboardingRoutes import fetch_accounts, get_bank_list
from upi.helpers.requests.FetchAccountsRequest import FetchAccountsRequest

setup_logging("INFO", None)


class SanityTests(TaskSet):
 @task
 def fetch_accounts(self):
 fetch_accounts_request = FetchAccountsRequest("")
 request_body = json.dumps(fetch_accounts_request.__dict__)
 request_body = json.loads(request_body)
 res = self.client.post(fetch_accounts(), headers={"authorization": "Bearer "
 "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9eyJzdWIiOiJ7XCJlbWFpbElkXCI6XCJoZWhlaGVAZ3JlZW5hbmltYWxzLmNvbVwiLFwidXNlckFjY291bnRJZFwiOlwiQUNDMTIzNDU2Nzg5MTBcIixcInBsYXRmb3JtXCI6bnVsbCxcInBsYXRmb3JtVmVyc2lvblwiOm51bGwsXCJvc1wiOm51bGwsXCJvc1ZlcnNpb25cIjpudWxsLFwiaXBBZGRyZXNzXCI6XCIxMC4xMC4wLjMsMTAuMTAuMTAuMTBcIixcIm1hY0FkZHJlc3NcIjpudWxsLFwidXNlckFnZW50XCI6XCJQb3N0bWFuUnVudGltZS83LjI5LjJcIixcImdyb3d3VXNlckFnZW50XCI6bnVsbCxcImRldmljZUlkXCI6bnVsbCxcInNlc3Npb25JZFwiOlwiYzEyM2RkM2ctMTk5My01NmdhLW8xMjktMTJiZGo0NTY3XCIsXCJzdXBlckFjY291bnRJZFwiOlwiQUNDMTIzNDU2Nzg5MTBcIn0iLCJuYmYiOjE3MjgzMjM2NzIsImlzcyI6ImdyZWVubGVhdmVzIiwiZXhwIjoxMjM0NTU1NzIyLCJpYXQiOjEyMzQ1NTU3MjJ9"}, json=request_body)
 print(res.status_code)

 @task
 def get_bank_list(self):
 res = self.client.get(get_bank_list(), headers={"authorization": "Bearer "
 "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9eyJzdWIiOiJ7XCJlbWFpbElkXCI6XCJoZWhlaGVAZ3JlZW5hbmltYWxzLmNvbVwiLFwidXNlckFjY291bnRJZFwiOlwiQUNDMTIzNDU2Nzg5MTBcIixcInBsYXRmb3JtXCI6bnVsbCxcInBsYXRmb3JtVmVyc2lvblwiOm51bGwsXCJvc1wiOm51bGwsXCJvc1ZlcnNpb25cIjpudWxsLFwiaXBBZGRyZXNzXCI6XCIxMC4xMC4wLjMsMTAuMTAuMTAuMTBcIixcIm1hY0FkZHJlc3NcIjpudWxsLFwidXNlckFnZW50XCI6XCJQb3N0bWFuUnVudGltZS83LjI5LjJcIixcImdyb3d3VXNlckFnZW50XCI6bnVsbCxcImRldmljZUlkXCI6bnVsbCxcInNlc3Npb25JZFwiOlwiYzEyM2RkM2ctMTk5My01NmdhLW8xMjktMTJiZGo0NTY3XCIsXCJzdXBlckFjY291bnRJZFwiOlwiQUNDMTIzNDU2Nzg5MTBcIn0iLCJuYmYiOjE3MjgzMjM2NzIsImlzcyI6ImdyZWVubGVhdmVzIiwiZXhwIjoxMjM0NTU1NzIyLCJpYXQiOjEyMzQ1NTU3MjJ9"})
 print(res.status_code)


class MyLoadTest(HttpUser):
 host = "https://uatapi.greenanimalsbank.com/v1/api/"
 wait_time = constant(1)
 tasks = [SanityTests]


# setup Environment and Runner
env = Environment(user_classes=[MyLoadTest])
env.create_local_runner()

# start a WebUI instance
env.create_web_ui("127.0.0.1", 8089)

# start a greenlet that periodically outputs the current stats
gevent.spawn(stats_printer(env.stats))

# start a greenlet that save current stats to history
gevent.spawn(stats_history, env.runner)

# start the test
env.runner.start(2, spawn_rate=1)

# in 60 seconds stop the runner
gevent.spawn_later(60, lambda: env.runner.quit())

# wait for the greenlets
env.runner.greenlet.join()

# stop the web server for good measures
env.web_ui.stop()
