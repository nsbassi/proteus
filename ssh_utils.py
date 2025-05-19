import paramiko
import time
import re


SCRDIR = "/patch/PLM/IQ/scripts"


def create_client(domain, host=None, sudoUser=None):
    user, password, client = domain.osuser, domain.ospass, paramiko.SSHClient()
    host = domain.env['nodes'][0]['ip'] if host is None else host

    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password)

    if (sudoUser):
        channel = client.invoke_shell()
        channel.send(f'sudo su - {sudoUser}\n')
        time.sleep(1)
        return client, channel
    return client, None


def ssh_authenticate(domain):
    try:
        user, cmd = domain.env['sudoUser'], 'echo Logged in as $(whoami) && pwd'
        client, channel = create_client(domain)

        output, error = execute_cmd_as(client, cmd, user)

        client.close()

        if re.search(f'Logged in as {user}', output):
            return True
        else:
            return False
    except Exception as e:
        print("SSH Error:", str(e))
        return False


def execute_acp_cmd(client, channel, cmd, password, rel):
    channel.send(f'cd /u11/agile/agile936/acp/work/{rel}\n')
    time.sleep(1)
    channel.send(cmd)

    timeout = 3
    start_time = time.time()
    output = ""
    while True:
        if channel.recv_ready():
            output += channel.recv(65535).decode()
            if "Enter user password" in output:
                channel.send(f'{password}\n')
                break
            elif time.time() - start_time > timeout:
                break
        elif time.time() - start_time > timeout:
            break
        else:
            time.sleep(0.1)

    output += read_shell_output(channel)
    client.close()

    return output, getOutcome(output)


def execute_iq_cmd(client, channel, rel, branch, wluser, wlpass, token):
    channel.send(f'cd /patch/PLM/IQ/{rel}\n')
    time.sleep(1)
    channel.send(
        f'{SCRDIR}/fileDeploy "{rel}" "{branch}" "{wluser}" "{wlpass}" "{token}"\n')

    timeout = 300
    start_time = time.time()
    output = ""
    outcome = "error"
    while True:
        if channel.recv_ready():
            output += channel.recv(65535).decode()
            if "Deployment completed successfully" in output:
                outcome = "success"
                break
            elif "Deployment Failed" in output:
                outcome = "error"
                break
            elif time.time() - start_time > timeout:
                break
        elif time.time() - start_time > timeout:
            break
        else:
            time.sleep(0.1)

    client.close()

    return output, outcome


def execute_setup(channel, year, rel, branch, opr, token):
    channel.send(
        f'{SCRDIR}/setupIQ "{year}" "{rel}" "{branch}" "{opr}" "{token}"\n')
    timeout = 3
    start_time = time.time()
    acp_ready = False
    output = ""
    while True:
        if channel.recv_ready():
            output += channel.recv(65535).decode()
            if "Script executed successfully." in output:
                acp_ready = True
                break
            elif time.time() - start_time > timeout:
                break
        elif time.time() - start_time > timeout:
            break
        else:
            time.sleep(0.1)

    return acp_ready, output


def execute_cmd_as(client, command, user):
    return execute_cmd(
        client, None, rf"echo '{command}' | sudo su - {user}")


def execute_cmd(client, channel, command):
    if channel:
        channel.send(command)
        output = read_shell_output(channel)
        return output, None
    stdin, stdout, stderr = client.exec_command(command, get_pty=True)
    return stdout.read().decode().strip(), stderr.read().decode().strip()


def read_shell_output(shell, timeout=10):
    output = ""
    start_time = time.time()

    while True:
        if shell.recv_ready():
            output += shell.recv(65535).decode()
            start_time = time.time()
        elif time.time() - start_time > timeout:
            break
        else:
            time.sleep(0.1)

    return output.strip()


def getOutcome(output):
    match = re.search(r"RETURN_CODE=(-?\d+)", output)
    if match:
        error_level = int(match.group(1))
        return "success" if error_level == 0 else "warning" if error_level < 0 else "error"
    else:
        return "error"
