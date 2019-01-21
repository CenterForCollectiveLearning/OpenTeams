# -*- coding: utf-8 -*-
# 导入模块
from wxpy import *
# 初始化机器人，扫码登陆
bot = Bot(cache_path=True)
bot.enable_puid()

# 初始化机器人，电脑弹出二维码，用手机微信扫码登陆
bot.groups(update=True, contact_only=False)
#微信登陆后，更新微信群列表（包括未保存到通讯录的群）
my_groups=bot.groups().search('USTC')
#找出名字包括“铲屎官”的群。假设我们有2个微信群，分别叫“铲屎官1群”、“铲屎官2群”。如果有3个或以上的铲屎群，上面这句代码也能全部找出来，并在后面的代码中实现多群同步。
my_groups[0].update_group(members_details=True)

for member in my_groups[0]:
    print member.display_name, member.nick_name, member.puid, member.wxid

# import itchat, time
# from itchat.content import TEXT
# #name = ' '
# roomslist = []
#
# @itchat.msg_register(itchat.content.TEXT)
# def print_content(msg):
#     print(msg['Text'])
#
# itchat.auto_login(hotReload=True)
# itchat.run()

# friends = itchat.get_friends(update=True)[1:]
# chatrooms = itchat.get_chatrooms(update=True)[1:]
#
# friend_usernames = []
# chatroom_usernames = []
#
# for friend in friends:
#   # print friend['NickName']
#   friend_usernames.append(friend['UserName'])
#
# # for chatroom in chatrooms:
# #   print chatroom['UserName']
# #   chatroom_usernames.append(chatroom['UserName'])
# #
# # print len(friend_usernames), "friends"
# # print len(chatroom_usernames), "chatrooms"
#
# one_friend = itchat.search_friends(userName = friend_usernames[0])
# print one_friend
# print itchat.search_friends(userName = friend_usernames[1])
# print itchat.search_friends(userName = friend_usernames[2])
#
# itchat.dump_login_status()

# def getroom_message(n):
#     #获取群的username，对群成员进行分析需要用到
#     itchat.dump_login_status() # 显示所有的群聊信息，默认是返回保存到通讯录中的群聊
#     RoomList =  itchat.search_chatrooms(name=n)
#     print "roomlist", RoomList
#     if RoomList is None:
#         print "%s group is not found!" % (n)
#     else:
#         return RoomList[0]['UserName']
#
# def getchatrooms():
#     #获取群聊列表
#     roomslist = itchat.get_chatrooms()
#     print roomslist
#     return roomslist
#
#
#
# for i in getchatrooms():
#     #print(i['NickName'])
#     roomslist.append(i['NickName'])
#
# with open('群用户名.txt', 'a')as f:
#     for n in roomslist:
#         ChatRoom = itchat.update_chatroom(getroom_message(n), detailedMember=True)
#         for i in ChatRoom['MemberList']:
#             print i
#             #print (i['Province']+":",i['NickName'])
#             # f.write(i['Province']+":"+i['NickName']+'\n')
#             # print('正在写入           '+i['Province']+":",i['NickName'])
#     f.close()
