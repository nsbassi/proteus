import time
import os
import sys
from flask import Flask, request, session, redirect, url_for, jsonify, send_from_directory
from models import Domain, AuthException
from github_utils import validate_github_token, getRepoContents
from ssh_utils import create_client, ssh_authenticate, read_shell_output, execute_iq_cmd
from ssh_utils import execute_cmd_as, execute_setup, execute_acp_cmd
from ssh_utils import SCRDIR, list_files, downloadFile
import traceback
import tempfile
from flask import send_file
from werkzeug.middleware.proxy_fix import ProxyFix


app = Flask(__name__, static_folder=None)
app.secret_key = os.urandom(24).hex()

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1,
                        x_host=1, x_port=1, x_prefix=1)
app.config['SESSION_COOKIE_SECURE'] = True

# Read context path, host, and port from env or sys.argv
CONTEXT_PATH = os.environ.get("PROTEUS_CONTEXT_PATH", "/proteus")
PORT = int(os.environ.get("PROTEUS_PORT", 4053))
ACPHOST = os.environ.get("ACPHOST", "10.2.16.22")
ACPUSER = os.environ.get("ACPUSER", "applplmu")
AGHOME = os.environ.get("AGHOME", "/u11/agile/agile936/agileDomain")


def get_static_dir():
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, "static")
    return "static"


STATIC_DIR = get_static_dir()


@app.route(f'{CONTEXT_PATH}/static/<path:filename>')
def custom_static(filename):
    # Check if file exists in static folder in current directory
    local_static = os.path.join(os.getcwd(), "static")
    local_path = os.path.join(local_static, filename)
    if os.path.isfile(local_path):
        return send_from_directory(local_static, filename)
    # Else serve from embedded static directory (PyInstaller, etc.)
    embedded_static = os.path.join(get_static_dir(), filename)
    if os.path.isfile(embedded_static):
        return send_from_directory(get_static_dir(), filename)
    jsonify({"error": "File not found"}), 404


@app.route(f'{CONTEXT_PATH}/app/<path:filename>')
def custom_static_app(filename):
    return static_file_path('app', filename)


@app.route(f'{CONTEXT_PATH}/resources/<path:filename>')
def custom_static_res(filename):
    return static_file_path('resources', filename)


@app.route(f'{CONTEXT_PATH}/data/<path:filename>')
def custom_static_data(filename):
    return static_file_path('data', filename)


def static_file_path(dir, filename):
    dirPath = os.path.join(os.getcwd(), "static", dir)
    if os.path.isfile(os.path.join(dirPath, filename)):
        print(f"Serving {filename} from {dirPath}")
        return send_from_directory(dirPath, filename)
    else:
        dirPath = os.path.join(get_static_dir(), dir)
        if os.path.isfile(os.path.join(dirPath, filename)):
            print(f"Serving {filename} from {dirPath}")
            return send_from_directory(dirPath, filename)
    return jsonify({"error": "File not found"}), 404


@app.route(f'{CONTEXT_PATH}/', methods=['GET'])
def serve_index():
    local_static = os.path.join(os.getcwd(), "static")
    index_path = os.path.join(local_static, 'index.html')
    if not os.path.isfile(index_path):
        index_path = os.path.join(get_static_dir(), 'index.html')

    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()
    # Inject meta tag just before </head>
    meta_tag = f'<meta name="X-Proteus-Context" content="{CONTEXT_PATH}">'
    if "</head>" in html:
        html = html.replace("</head>", f"    {meta_tag}\n</head>")
    else:
        # fallback: add at the top if no </head> found
        html = meta_tag + "\n" + html
    return html, 200, {'Content-Type': 'text/html'}


@app.route(f'{CONTEXT_PATH}/login', methods=['POST'])
def login():
    domain = Domain(request.json)
    print(domain)
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


@app.route(f'{CONTEXT_PATH}/restoreSession', methods=['GET'])
def restoreSession():
    try:
        d = getDomain()
        return jsonify({"env": d.env, "gituser": d.gitUser, "osuser": d.osuser})
    except Exception as e:
        return jsonify({"error": 'Invalid session state'}), 401


@app.route(f"{CONTEXT_PATH}/logout")
def logout():
    session.clear()
    return redirect(url_for("/"))


@app.route(f'{CONTEXT_PATH}/getYears', methods=['GET'])
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


@app.route(f'{CONTEXT_PATH}/getReleases', methods=['GET'])
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


@app.route(f'{CONTEXT_PATH}/getReleaseDetails', methods=['POST'])
def getReleaseDetails():
    year, release = request.json['year'], request.json['release']
    domain = getDomain()

    acpStatus, acpResp = getRepoContents(domain, 'acp', year, release)
    iqStatus, iqResp = getRepoContents(domain, 'iq', year, release)

    return jsonify({
        "acp": acpStatus == 200,
        "iq": iqStatus == 200
    })


@app.route(f'{CONTEXT_PATH}/setupFileIQ', methods=['POST'])
def setupFileIQ():
    y, r = (request.json.get(k) for k in ('year', 'release'))

    domain = getDomain()
    t, b = domain.gitToken, domain.gitBranch

    cl, ch = create_client(domain, ACPHOST, ACPUSER)
    iq_ready, output = execute_setup(ch, y, r, b, 'IQ', t)
    cl.close()

    outcome = "error" if not iq_ready else "success"
    return jsonify({"outcome": outcome, "output": output})


@app.route(f'{CONTEXT_PATH}/deployFiles', methods=['POST'])
def deployFiles():
    r, wbUser, wbPass, node = (request.json.get(k)
                               for k in ('release', 'wbUser', 'wbPass', 'node'))

    domain = getDomain()
    t, b, user = domain.gitToken, domain.gitBranch, domain.env['sudoUser']

    client, channel = create_client(domain, node['ip'], user)
    output, outcome = execute_iq_cmd(client, channel, r, b, wbUser, wbPass, t)
    client.close()

    return jsonify({"outcome": outcome, "node": node, "output": output})


@app.route(f'{CONTEXT_PATH}/exportCfg', methods=['POST'])
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


@app.route(f'{CONTEXT_PATH}/deepCmp', methods=['POST'])
def deepCmp():
    r, f, p = (request.json.get(k)
               for k in ('release', 'fromEnv', 'toPass'))
    domain = getDomain()
    t = domain.env['name'].lower()

    client, channel = create_client(domain, ACPHOST, ACPUSER)

    output, outcome = execute_acp_cmd(client,
                                      channel, f'./acp deep_compare {f.lower()} {t}\n', p, r)

    return jsonify({"outcome": outcome, "fromEnv": f.upper(), "toEnv": t.upper(), "output": output})


@app.route(f'{CONTEXT_PATH}/importCfg', methods=['POST'])
def importCfg():
    r, f, p = (request.json.get(k)
               for k in ('release', 'fromEnv', 'toPass'))
    domain = getDomain()
    t = domain.env['name'].lower()

    client, channel = create_client(domain, ACPHOST, ACPUSER)

    output, outcome = execute_acp_cmd(client,
                                      channel, f'./acp import {f.lower()} {t}\n', p, r)

    return jsonify({"outcome": outcome, "fromEnv": f.upper(), "toEnv": t.upper(), "output": output})


@app.route(f'{CONTEXT_PATH}/stopNode', methods=['POST'])
def stopNode():
    idx, host, domain = request.json.get(
        'idx'), request.json.get('ip'), getDomain()
    client, channel = create_client(domain, host)
    cmd, user = f'~/bin/stopagileManaged{idx}\n', domain.env['sudoUser']

    output, error = execute_cmd_as(client, cmd, user)
    client.close()

    return jsonify({"outcome": "success", "output": output})


@app.route(f'{CONTEXT_PATH}/startNode', methods=['POST'])
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


@app.route(f'{CONTEXT_PATH}/startWebforms', methods=['POST'])
def startWebforms():
    domain = getDomain()
    client, channel = create_client(domain, None, domain.env['sudoUser'])

    output, outcome = execute_acp_cmd(client,
                                      channel, f'./acp import {f} {t}\n', p, r)

    return jsonify({"outcome": outcome, "fromEnv": f.upper(), "toEnv": t.upper(), "output": output})


@app.route(f'{CONTEXT_PATH}/listFiles', methods=['GET'])
def listFiles():
    directory = request.args.get('dir')
    if not directory:
        return jsonify({"error": "Missing directory parameter"}), 400
    files = get_files_in_directory(directory)
    return jsonify({"files": files})


@app.route(f'{CONTEXT_PATH}/downloadFile', methods=['GET'])
def downloadFile():
    directory = os.path.join(
        '/u11/agile/agile936/acp/work', request.args.get('release'))
    filename = request.args.get('filename')
    if not directory or not filename:
        return jsonify({"error": "Missing directory or filename parameter"}), 400

    domain = getDomain()
    host = request.args.get('host') or ACPHOST
    user = domain.env.get('sudoUser', ACPUSER)

    try:
        client, channel = create_client(domain, host, user)
        remote_path = f"/tmp/{filename}"
        channel.send(f'cp {os.path.join(directory, filename)} {remote_path}\n')
        time.sleep(1)

        sftp = client.open_sftp()
        if not sftp.stat(remote_path):
            client.close()
            return jsonify({"error": "File does not exist on remote server"}), 404

        tmp_file = tempfile.NamedTemporaryFile(delete=False)
        sftp.get(remote_path, tmp_file.name)
        sftp.close()
        client.close()

        tmp_file.close()
        return send_file(tmp_file.name, as_attachment=True, download_name=filename)
    except FileNotFoundError:
        return jsonify({"error": "File does not exist on remote server"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
    app.run(host='0.0.0.0', port=PORT, debug=True)
