import datetime
import utils

class Worker:
    

    def __init__(self, name, id, status = 'employee'):
        self.name = name
        self.status = status
        self.id = id
        self.sessions = []
        self.sessions = self.load_sessions()


    # load sessions
    def load_sessions(self):
        results = []
        df_sessions = utils.load_all_sessions()

        for _, row in df_sessions.iterrows():
            if self.id == row['worker_id']:
                start = datetime.datetime.strptime(row['start'], "%Y-%m-%d %H:%M")
                end = datetime.datetime.strptime(row['end'], "%Y-%m-%d %H:%M")
                activity = row['activity']
                results.append(Session(self.id, start, end, activity))
            else: continue
        # print('model: ', results)
        return results


    # Add a new session to the list
    def add_session(self, session):
        self.sessions.append(session)

    # 
    def get_sessions(self, week_start: datetime, num_days: int):
        results = []
        week_end = week_start + datetime.timedelta(days=num_days)
        for s in self.sessions:
            if (s.start > week_start and s.start < week_end) or (s.end > week_start and s.end < week_end):
                results.append(s)
        
        return results

    # Return only sessions within the current week
    def get_sessions_in_week(self, week_start: datetime):
        return self.get_sessions(week_start, 7)
    
    # Return Total sessions given number of weeks(period should be given in number of weeks)
    def get_total_sessions(self, period, week_start):
        period_days = period * 7
        sessions = self.get_sessions(week_start, period_days)
        return len(sessions)

    
    """ def print_week(self, week_start):
        week_end = week_start + datetime.timedelta(days=7)
        results = self.get_sessions_in_week(self, week_start)
         """
    
    # Show ID, name, and session count
    def __repr__(self):
        return f"Name: {self.name}, ID: {self.id}, Sessions: {len(self.sessions)}"


    def isEmployee(self, id):
        return self.status == 'employee'
    
    def getNameByID(self, id):
        return self.name


class Session:
    night = ''
    activityList = ['X', 'S', f'F{night}', 'RP', '']

    def __init__(self, id, start, end, activity_type):
        self.worker_id = id
        self.start = start
        self.end = end
        if self.spans_multiple_days():
            self.night = self.end.hour

        self.activity_type = activity_type if activity_type in self.activityList else self.activityList[0]


    # return the session object
    def get_session(self):
        return {
            'worker_id': self.worker_id,
            'start': self.start.strftime("%Y-%m-%d %H:%M"),
            'end': self.end.strftime("%Y-%m-%d %H:%M"),
            'activity': self.activity_type
        }


    # Return number of hours, minutes worked
    def duration(self):
        return (self.end - self.start)

    # Check if start and end fall on different days
    def spans_multiple_days(self):
        return not (self.start.day == self.end.day)

    # Returns weekday of start
    def get_start_day(self)	:
        return self.start.strftime("%A")

    # Returns weekday of end
    def get_end_day(self):
        return self.end.strftime("%A")

    # Debug-friendly string representation
    def __repr__(self):
        return f"{self.worker_id}: {self.activity_type} - {self.start.strftime('%Y-%m-%d %H:%M')} → {self.end.strftime('%Y-%m-%d %H:%M')}"

