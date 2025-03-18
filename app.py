from flask import Flask, request, session, redirect, url_for, jsonify
import paramiko
import requests
import time
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5500"], supports_credentials=True)
app.secret_key = 'supersecretkey'


GITHUB_URL = "https://github.biogen.com"


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']
    hostname = data['environment']['nodes'][0]['ip']
    athtoken = data['token']
    sudouser = data['environment']['sudoUser']

    valid_token, github_username = validate_github_token(athtoken)
    if not valid_token:
        return jsonify({"error": "Invalid GitHub token"}), 401

    if ssh_authenticate(username, password, hostname, sudouser):
        session['username'] = username
        session['hostname'] = hostname
        return jsonify({"message": "Login successful", "user": github_username}), 200
    else:
        return jsonify({"error": "Login Failed"}), 401


@app.route('/getReleaseDetails', methods=['POST'])
def getReleaseDetails():
    try:
        data = request.json
        token = data['token']
        env = data['env'] or 'prod'
        branch = get_branch(env)
        year = data['year']
        release = data['release']

        acp_url = f"{GITHUB_URL}/api/v3/repos/agile-plm/acp-repo/contents/acp-repo/src/{year}/{release}.xml?ref={branch}"
        iq_url = f"{GITHUB_URL}/api/v3/repos/agile-plm/iq-repo/contents/src/{year}/{release}.sh?ref={branch}"
        headers = {"Authorization": f"token {token}"}

        acp_response = requests.get(acp_url, headers=headers)
        iq_response = requests.get(iq_url, headers=headers)

        result = {
            "acp": acp_response.status_code == 200,
            "iq": iq_response.status_code == 200
        }

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/runACP', methods=['POST'])
def runACP():
    data = request.json
    username = data['username']
    password = data['password']
    env = data['env']
    year = data['year']
    release = data['release']
    branch = get_branch(env)
    nodes = data['nodes']
    athtoken = data['token']

    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        return jsonify({"error": "Failed to fetch files"}), max(response.status_code, response1.status_code)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/getYears', methods=['POST'])
def getYears():
    try:
        data = request.json
        token = data['token']
        branch = get_branch(data['env'] or 'prod')

        url = f"{GITHUB_URL}/api/v3/repos/agile-plm/acp-repo/contents/acp-repo/src?ref={branch}"
        headers = {"Authorization": f"token {token}"}
        response = requests.get(url, headers=headers)

        url1 = f"{GITHUB_URL}/api/v3/repos/agile-plm/iq-repo/contents/src?ref={branch}"
        response1 = requests.get(url1, headers=headers)

        if response.status_code == 200 and response1.status_code == 200:
            files = response.json()
            files1 = response1.json()

            years = [{"id": file['name']}
                     for file in files if file['type'] == 'dir']
            years1 = [{"id": file['name']}
                      for file in files1 if file['type'] == 'dir']

            # Combine lists and remove duplicates
            combined_years = {
                year['id']: year for year in years + years1}.values()

            return jsonify(list(combined_years))
        else:
            return jsonify({"error": "Failed to fetch files"}), max(response.status_code, response1.status_code)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/getReleases', methods=['POST'])
def getReleases():
    try:
        data = request.json
        token = data['token']
        year = data['year']
        branch = get_branch(data['env'] or 'prod')

        url = f"{GITHUB_URL}/api/v3/repos/agile-plm/acp-repo/contents/acp-repo/src/{year}?ref={branch}"
        headers = {"Authorization": f"token {token}"}
        response = requests.get(url, headers=headers)

        url1 = f"{GITHUB_URL}/api/v3/repos/agile-plm/iq-repo/contents/src/{year}?ref={branch}"
        response1 = requests.get(url1, headers=headers)

        if response.status_code == 200 and response1.status_code == 200:
            files = response.json()
            files1 = response1.json()

            releases = [{"id": file['name'].replace(".xml", "")}
                        for file in files if file['type'] == 'file' and file['name'].endswith(".xml")]
            releases1 = [{"id": file['name'].replace(".sh", "")}
                         for file in files1 if file['type'] == 'file' and file['name'].endswith(".sh")]
            combined_releases = {
                release['id']: release for release in releases + releases1}.values()
            return jsonify(list(combined_releases))
        else:
            return jsonify({"error": "Failed to fetch files"}), max(response.status_code, response1.status_code)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_branch(env):
    if env == 'prod':
        return 'master'
    elif env == 'qa':
        return 'qa'
    else:
        return 'dev'


def validate_github_token(token):
    url = f"{GITHUB_URL}/api/v3/user"
    headers = {"Authorization": f"token {token}"}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        user_data = response.json()
        return True, user_data.get("login")
    return False, None


def ssh_authenticate(username, password, hostname, sudo_user="root"):
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname, username=username, password=password)

        channel = client.invoke_shell()
        channel.send(f"sudo su - {sudo_user}\n")
        time.sleep(3)

        output = channel.recv(1024).decode().strip()
        print("Output:", output)

        client.close()

        # Check if the output contains 'Last login:' using regex
        if re.search(r'Last login:', output):
            return True
        else:
            return False
    except Exception as e:
        print("SSH Error:", str(e))
        return False


if __name__ == '__main__':
    app.run(debug=True)
