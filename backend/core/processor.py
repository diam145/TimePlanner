from datetime import datetime
import pandas as pd
import utils
import sqlite3

# dataframe for all the workers
def getWorkersDataframe():
    conn = sqlite3.connect('./data/workers.db')
    df = pd.read_sql_query("SELECT * FROM workers", conn)
    conn.close()
    return df.set_index('id')

def getDataframe(week_start):
    df_workers = getWorkersDataframe()
    print("type of df_workers", type(df_workers))
    print("Debug df_workers (processor:10)", df_workers)
    result =  utils.generate_weekly_table(df_workers, week_start)
    print("Debug dataframe for that week (processor:12)", result)
    return result


def currentWeekRepport():
    # Default week start
    week_start = utils.get_last_sunday()

    df = getDataframe(week_start)

    # Export the weekly report into the archive
    utils.export_weekly_report(df, week_start)
