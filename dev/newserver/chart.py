import plotly
plotly.tools.set_credentials_file(username='Jingxian', api_key='k6dQG91LaLxsdkvbCRyU')

import plotly.plotly as py
import plotly.graph_objs as go


from datetime import datetime
x = [datetime(year=2016, month=5, day=16),
     datetime(year=2016, month=6, day=18),
     datetime(year=2016, month=7, day=11),
     datetime(year=2016, month=7, day=13),
     datetime(year=2016, month=7, day=22),
     datetime(year=2016, month=8, day=13),
     datetime(year=2016, month=9, day=6),
     datetime(year=2016, month=9, day=11),
     datetime(year=2016, month=9, day=17),
     datetime(year=2016, month=9, day=24),
     datetime(year=2017, month=1, day=9)]

cesar = go.Scatter(x = x, y = [0.000276396, 0.005902154, 0.00563391, 0.030821048, 0.021862213, 0.020773797, 0.167191604, 0.165985439, 0.075906976, 0.043913378, 0.044736733], mode = 'lines+markers', name = 'Cesar')
jessica = go.Scatter(x = x, y = [0.000755482, 0.001706907, 0.002093332, 0.449954738, 0.264571878, 0.272241159, 0.157916973, 0.153991042, 0.025916317, 0.023252845, 0.018239058], mode = 'lines+markers', name = 'Jessica')
data = [cesar, jessica]
layout = dict(xaxis = dict(title = 'Time'),
              yaxis = dict(title = 'Betweeness Centrality'),
              )

fig = dict(data=data, layout=layout)
py.plot(fig)

# import numpy as np
#
# N = 500
# random_x = np.linspace(0, 1, N)
# random_y = np.random.randn(N)
#
# # Create a trace
# trace = go.Scatter(
#     x = random_x,
#     y = random_y
# )
#
# data = [trace]
#
# # Plot and embed in ipython notebook!
# py.plot(data, filename='basic-line')