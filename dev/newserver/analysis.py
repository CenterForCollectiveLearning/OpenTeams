import pandas as pd
import statsmodels.api as sm
from statsmodels.formula.api import ols
import matplotlib.pyplot as plt
from pyvttbl import DataFrame
from scipy import stats
from tabulate import tabulate
import db
import sys

team_id= sys.argv[1]
method= sys.argv[2]
# param_3= sys.argv[3]

# team_id = "cl2017"
team = db.getTeamAdd(team_id)

nn = 0
for ii in range(0, len(team['members'])):
  nn += 1
emails = ["" for i in range(nn)]
usersinfo = ["" for i in range(nn)]
centralities = ["" for i in range(nn)]
nnn = 0
for ii in range(0, len(team['members'])):
  centralities[nnn] = team['members'][ii]['centralities']
  emails[nnn] = team['members'][ii]['email']
  the_userinfo = db.getState(team['members'][ii]['email'], None)['userinfo']
  usersinfo[nnn] = {'name': the_userinfo['name'], 'given_name': the_userinfo['given_name'],
                    'family_name': the_userinfo['family_name'], 'email': the_userinfo['email']}
  centralities[nnn] = team['members'][ii]['centralities']
  nnn += 1

personalities = []
for ii in range(0, len(emails)):
  personality = db.getPersonality(emails[ii])
  if personality is None:
    personalities.append({})
  else:
    personalities.append(personality)
pairs = team['pairs']

data = []
for ii in range(0, len(pairs)):
  if pairs[ii]['emails'][len(pairs[ii]['emails']) - 2] != 0 and pairs[ii]['emails'][len(pairs[ii]['emails']) - 1] != 0:
    member1 = pairs[ii]['pair'][0:pairs[ii]['pair'].index('+')]
    member2 = pairs[ii]['pair'][pairs[ii]['pair'].index('+')+1:]
    gender1 = ""
    gender2 = ""
    for jj in range(0, len(usersinfo)):
      if usersinfo[jj]['name'] == member1 and 'demographics' in personalities[jj]:
        gender1 = personalities[jj]['demographics']['gender']
      elif usersinfo[jj]['name'] == member2 and 'demographics' in personalities[jj]:
        gender2 = personalities[jj]['demographics']['gender']
    if gender1 != "" and gender2 != "":
      if gender1 == gender2:
        if method == "3":
          gender = gender1 + gender2
        else:
          gender = "ss"
      else:
        gender = 'mf'
      data.append({"pair": pairs[ii]['pair'], "genders": gender, "weight": pairs[ii]['emails'][len(pairs[ii]['emails']) - 1]})
data = pd.DataFrame(data)
print data


# Create a boxplot
# data.boxplot('weight', by='genders', figsize=(12, 8))
grps = pd.unique(data.genders.values)
if len(grps) <= 1:
  print "Only one group:", grps[0]
else:
  d_data = {grp: data['weight'][data.genders == grp] for grp in grps}
  # k = len(pd.unique(data.genders))  # number of conditions
  # N = len(data.values)  # conditions times participants
  # n = data.groupby('genders').size()[0]  # Participants in each condition
  #
  # DFbetween = k - 1
  # DFwithin = N - k
  # DFtotal = N - 1
  #
  # SSbetween = (sum(data.groupby('genders').sum()['weight']**2)/n) - (data['weight'].sum()**2)/N
  # sum_y_squared = sum([value**2 for value in data['weight'].values])
  # SSwithin = sum_y_squared - sum(data.groupby('genders').sum()['weight']**2)/n
  # SStotal = sum_y_squared - (data['weight'].sum()**2)/N
  # MSbetween = SSbetween/DFbetween
  # MSwithin = SSwithin/DFwithin
  # F = MSbetween/MSwithin
  # p = stats.f.sf(F, DFbetween, DFwithin)
  # eta_sqrd = SSbetween/SStotal

  print data.groupby('genders')['weight'].describe()
  # print tabulate([['Between-treatments', SSbetween, DFbetween, MSbetween],
  #                 ['Within-treatments', SSwithin, DFwithin, MSwithin],
  #                 ['Total', SStotal, DFtotal, '', '']],
  #                headers=['Source', 'SS', 'df', 'MS'])
  # print 'F =', F
  # print 'p =', p

  mod = ols('weight ~ genders',
            data=data).fit()
  aov_table = sm.stats.anova_lm(mod, typ=2)
  print aov_table

