import time
import os
import sys
from flask import Flask, request, session, redirect, url_for, jsonify, send_from_directory
from models import Domain, AuthException
from github_utils import validate_github_token, getRepoContents
from ssh_utils import create_client, ssh_authenticate, read_shell_output, execute_iq_cmd, execute_cmd_as, execute_setup, execute_acp_cmd
from ssh_utils import SCRDIR
import traceback

app = Flask(__name__, static_folder=None)
app.secret_key = os.urandom(24).hex()

ACPHOST = "10.2.16.22"
ACPUSER = "applplmu"
AGHOME = "/u11/agile/agile936/agileDomain"


def get_static_dir():
    local_static = os.path.join(os.getcwd(), "static")
    if os.path.exists(local_static):
        return local_static
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, "static")
    return "static"


STATIC_DIR = get_static_dir()


@app.route('/static/<path:filename>')
def custom_static(filename):
    return send_from_directory(STATIC_DIR, filename)


@app.route('/', methods=['GET'])
def serve_index():
    base_path = os.path.abspath(os.path.dirname(__file__))
    return send_from_directory(base_path, 'index.html')


@app.route('/login', methods=['POST'])
def login():
    domain = Domain(request.json)

    valid_token, github_username, message = validate_github_token(domain)
    if not valid_token:
        return jsonify({"error": message}), 500
    else:
        domain.gitUser = github_username

    if ssh_authenticate(domain):
        session['domain'] = domain.to_dict()
        return jsonify({"message": "Login successful", "user": github_username}), 200
    else:
        return jsonify({"error": f"Failed to login as {domain.osuser} to host {domain.env['nodes'][0]['ip']}"}), 500


@app.route('/restoreSession', methods=['GET'])
def restoreSession():
    try:
        d = getDomain()
        return jsonify({"env": d.env, "gituser": d.gitUser, "osuser": d.osuser})
    except Exception as e:
        return jsonify({"error": 'Invalid session state'}), 401


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("/"))


@app.route('/getYears', methods=['GET'])
def getYears():
    domain = getDomain()
    acpStatus, acpResp = getRepoContents(domain, 'acp')
    iqStatus, iqResp = getRepoContents(domain, 'iq')

    if acpStatus == 200 and iqStatus == 200:
        acpFiles = acpResp.json()
        ipFiles = iqResp.json()

        iqYears = [{"id": file['name']}
                   for file in acpFiles if file['type'] == 'dir']
        acpYears = [{"id": file['name']}
                    for file in ipFiles if file['type'] == 'dir']
        combined_years = list(
            {year['id']: year for year in iqYears + acpYears}.values())

        return jsonify(combined_years)
    else:
        return jsonify({"error": "Failed to fetch Years from Github"}), max(acpStatus, iqStatus)


@app.route('/getReleases', methods=['GET'])
def getReleases():
    year = request.args.get('year')
    domain = getDomain()

    acpStatus, acpResp = getRepoContents(domain, 'acp', year)
    iqStatus, iqResp = getRepoContents(domain, 'iq', year)

    if acpStatus == 200 and iqStatus == 200:
        acpFiles = acpResp.json()
        ipFiles = iqResp.json()

        iqReleases = [{"id": file['name'].replace(".xml", "")}
                      for file in acpFiles if file['type'] == 'file' and file['name'].endswith(".xml")]
        acpReleases = [{"id": file['name'].replace(".sh", "")}
                       for file in ipFiles if file['type'] == 'file' and file['name'].endswith(".sh")]
        combined_releases = list(
            {release['id']: release for release in iqReleases + acpReleases}.values())
        return jsonify(combined_releases)
    else:
        return jsonify({"error": "Failed to get Releases from Github"}), max(acpStatus, iqStatus)


@app.route('/getReleaseDetails', methods=['POST'])
def getReleaseDetails():
    year, release = request.json['year'], request.json['release']
    domain = getDomain()

    acpStatus, acpResp = getRepoContents(domain, 'acp', year, release)
    iqStatus, iqResp = getRepoContents(domain, 'iq', year, release)

    return jsonify({
        "acp": acpStatus == 200,
        "iq": iqStatus == 200
    })


@app.route('/setupFileIQ', methods=['POST'])
def setupFileIQ():
    y, r = (request.json.get(k) for k in ('year', 'release'))

    domain = getDomain()
    t, b = domain.gitToken, domain.gitBranch

    cl, ch = create_client(domain, ACPHOST, ACPUSER)
    iq_ready, output = execute_setup(ch, y, r, b, 'IQ', t)
    cl.close()

    outcome = "error" if not iq_ready else "success"
    return jsonify({"outcome": outcome, "output": output})


@app.route('/deployFiles', methods=['POST'])
def deployFiles():
    r, wbUser, wbPass, node = (request.json.get(k)
                               for k in ('release', 'wbUser', 'wbPass', 'node'))

    domain = getDomain()
    t, b, user = domain.gitToken, domain.gitBranch, domain.env['sudoUser']

    client, channel = create_client(domain, node['ip'], user)
    output, outcome = execute_iq_cmd(client, channel, r, b, wbUser, wbPass, t)
    client.close()

    return jsonify({"outcome": outcome, "node": node, "output": output})


@app.route('/exportCfg', methods=['POST'])
def exportCfg():
    y, r, f, c, p = (request.json.get(k)
                     for k in ('year', 'release', 'fromEnv', 'deepCompare', 'fromPass'))

    domain = getDomain()
    t, b = domain.gitToken, domain.gitBranch

    client, channel = create_client(domain, ACPHOST, ACPUSER)

    acp_ready, output = execute_setup(channel, y, r, b, 'ACP', t)

    if (not acp_ready):
        return jsonify({"outcome": "error",  "fromEnv": f.upper(), "output": output})

    output, outcome = execute_acp_cmd(
        client, channel, f'./acp export {f.lower()}\n', p, r)
    client.close()

    return jsonify({"outcome": outcome, "fromEnv": f.upper(), "output": output})


@app.route('/deepCmp', methods=['POST'])
def deepCmp():
    r, f, p = (request.json.get(k)
               for k in ('release', 'fromEnv', 'toPass'))
    domain = getDomain()
    t = domain.env['name'].lower()

    client, channel = create_client(domain, ACPHOST, ACPUSER)

    output, outcome = execute_acp_cmd(client,
                                      channel, f'./acp deep_compare {f.lower()} {t}\n', p, r)

    return jsonify({"outcome": outcome, "fromEnv": f.upper(), "toEnv": t.upper(), "output": output})


@app.route('/importCfg', methods=['POST'])
def importCfg():
    r, f, p = (request.json.get(k)
               for k in ('release', 'fromEnv', 'toPass'))
    domain = getDomain()
    t = domain.env['name'].lower()

    client, channel = create_client(domain, ACPHOST, ACPUSER)

    output, outcome = execute_acp_cmd(client,
                                      channel, f'./acp import {f.lower()} {t}\n', p, r)

    return jsonify({"outcome": outcome, "fromEnv": f.upper(), "toEnv": t.upper(), "output": output})


@app.route('/stopNode', methods=['POST'])
def stopNode():
    idx, host, domain = request.json.get(
        'idx'), request.json.get('ip'), getDomain()
    client, channel = create_client(domain, host)
    cmd, user = f'~/bin/stopagileManaged{idx}\n', domain.env['sudoUser']

    output, error = execute_cmd_as(client, cmd, user)
    client.close()

    return jsonify({"outcome": "success", "output": output})


@app.route('/startNode', methods=['POST'])
def startNode():
    idx, host, domain = request.json.get(
        'idx'), request.json.get('ip'), getDomain()
    user = domain.env['sudoUser']
    client, channel = create_client(domain, host, user)

    channel.send(f'~/bin/startagileManaged{idx}\n')
    time.sleep(2)
    output = read_shell_output(channel)
    client.close()

    client, channel = create_client(domain, host)
    output1, error = execute_cmd_as(client, f"{SCRDIR}/checkStatus", user)
    client.close()
    if 'URL is up and accessible.' in output1:
        return jsonify({"outcome":  "success", "output": output + '\n' + output1})
    else:
        return jsonify({"outcome":  "error", "output": output + '\n' + output1})


@app.route('/startWebforms', methods=['POST'])
def startWebforms():
    domain = getDomain()
    client, channel = create_client(domain, None, domain.env['sudoUser'])

    output, outcome = execute_acp_cmd(client,
                                      channel, f'./acp import {f} {t}\n', p, r)

    return jsonify({"outcome": outcome, "fromEnv": f.upper(), "toEnv": t.upper(), "output": output})


@app.errorhandler(AuthException)
def handle_auth_exception(error):
    return jsonify({
        "error": "Invalid Session",
        "message": "Your session is invalid. Please log in again."
    }), 401


@app.errorhandler(Exception)
def handle_exception(e):
    stack_trace = traceback.format_exc()
    print("Exception stack trace as string:")
    print(stack_trace)
    return jsonify({"error": str(e)}), 500


def getDomain():
    domain_data = session.get('domain')
    if not domain_data:
        raise AuthException("Invalid session state")
    return Domain.from_dict(domain_data)


def get_branch(env):
    if env == 'prod':
        return 'master'
    elif env == 'qa':
        return 'qa'
    else:
        return 'dev'


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5053, debug=True)
