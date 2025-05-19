import requests
from flask import session
from requests.exceptions import ConnectionError
from models import Domain

GITHUB_URL = "https://github.biogen.com/api/v3"


def validate_github_token(domain):
    try:
        headers = {"Authorization": f"token {domain.gitToken}"}
        response = requests.get(f"{GITHUB_URL}/user", headers=headers)

        if response.status_code == 200:
            user_data = response.json()
            return True, user_data.get("login"), None
        return False, None, "Error validating GitHub token."
    except ConnectionError as ce:
        return False, None, f"Failed to connect to Github server at {GITHUB_URL}."
    except Exception as e:
        return False, None, "Error validating GitHub token."


def getRepoContents(domain, repo, year='', release=''):
    headers = {"Authorization": f"token {domain.gitToken}"}
    response = requests.get(getRepoURL(
        domain, repo, year, release), headers=headers)

    if response.status_code == 200:
        return response.status_code, response
    else:
        return response.status_code, {"error": "Failed to fetch contents from Github"}


def getRepoURL(domain, repo, year='', release=''):
    url = f"{GITHUB_URL}/repos/agile-plm/{repo}-repo/contents/"

    suffix = ''
    if (year != ''):
        suffix = f"/{year}"
    if (release != ''):
        suffix = f"{suffix}/{release}{'.xml' if repo == 'acp' else '.sh'}"

    suffix = f"{suffix}?ref={domain.gitBranch}"
    return f"{url}{'acp-repo/src' if repo == 'acp' else 'src'}{suffix}"
