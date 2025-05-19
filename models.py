class Domain:
    def __init__(self, data):
        self.env = data['environment']
        self.osuser = data['username']
        self.ospass = data['password']
        self.gitToken = data['token']
        self.gitBranch = data['environment']['branch']
        self.gitUser = None

    def to_dict(self):
        return {
            "env": self.env,
            "osuser": self.osuser,
            "ospass": self.ospass,
            "gitToken": self.gitToken,
            "gitBranch": self.gitBranch,
            "gitUser": self.gitUser,
        }

    @classmethod
    def from_dict(cls, data):
        domain = cls({
            "environment": data["env"],
            "username": data["osuser"],
            "password": data["ospass"],
            "token": data["gitToken"],
        })
        domain.gitBranch = data["gitBranch"]
        domain.gitUser = data["gitUser"]
        return domain

    def __repr__(self):
        return f"<Domain(env={self.env}, osuser={self.osuser}, gitUser={self.gitUser})>"


class AuthException(Exception):
    pass
