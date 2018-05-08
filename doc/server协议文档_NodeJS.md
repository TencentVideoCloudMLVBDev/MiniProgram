# 后台协议设计

* 接口命名采用c风格，举例 get_push_url
* 请求方式POST，请求的body是Json格式。

## 接口说明

### get_login_info 获取sdkAppID、accountType、userID、userSig信息

#### 参数说明

| 参数名称   | 类型         | 是否必填 | 说明                 |
| ------ | ---------- | ---- | ------------------ |
| userID    | String | 是    | 用户id，可为空，为空则随机分配 |

#### 返回结果说明

| 属性名称    | 类型         | 说明     |
| ------- | ---------- | ------ |
| code | int        | 返回码，0表示成功 |
| message | String | 描述信息 |
| sdkAppID | String | 互动直播的sdkAppID |
| accountType | String | 互动直播的accountType |
| userID | String | 用户id |
| userSig | String | 用户签名 |


### create_room 创建房间

#### 参数说明

| 参数名称   | 类型         | 是否必填 | 说明                 |
| ------ | ---------- | ---- | ------------------ |
| userID    | String | 是    | 创建者用户id，不可为空 |
| nickName    | String | 否    | 创建者昵称，可为空 |
| roomInfo    | String | 是    | 房间名称 |

#### 返回结果说明

| 属性名称    | 类型         | 说明     |
| ------- | ---------- | ------ |
| code | int        | 返回码，0表示成功 |
| message | String | 描述信息 |
| roomID | String | 房间id |
| roomInfo |  String | 房间名 |
| privateMapKey | String | 权限位 |

### enter_room 进入房间

#### 参数说明

| 参数名称   | 类型         | 是否必填 | 说明                 |
| ------ | ---------- | ---- | ------------------ |
| userID    | String | 是    | 请求加房的用户id |
| nickName    | String | 否    | 请求加房的用户昵称，可为空 |
| roomID    | String | 是    | 请求加入的房间id |

#### 返回结果说明

| 属性名称    | 类型         | 说明     |
| ------- | ---------- | ------ |
| code | int        | 返回码，0表示成功 |
| message | String | 描述信息 |
| userID | String | 用户id |
| roomID |  String | 房间id |
| privateMapKey | String | 权限位 |

### quit_room 退出房间

#### 参数说明

| 参数名称   | 类型         | 是否必填 | 说明                 |
| ------ | ---------- | ---- | ------------------ |
| userID    | String | 是    | 请求退出房间的用户id|
| roomID    | String | 是    | 请求退出的房间id|

#### 返回结果说明

| 属性名称    | 类型         | 说明     |
| ------- | ---------- | ------ |
| code | int        | 返回码，0表示成功 |
| message | String | 描述信息 |

### heartbeat 心跳，当终端心跳超时后踢出房间

#### 参数说明

| 参数名称   | 类型         | 是否必填 | 说明                 |
| ------ | ---------- | ---- | ------------------ |
| userID    | String | 是    | 用户id|
| roomID    | String | 是    | 房间id|

#### 返回结果说明

| 属性名称    | 类型         | 说明     |
| ------- | ---------- | ------ |
| code | int        | 返回码，0表示成功 |
| message | String | 描述信息 |

### get_room_list 获取webrtc房间列表

#### 参数说明

| 参数名称   | 类型         | 是否必填 | 说明                 |
| ------ | ---------- | ---- | ------------------ |
| index    | int | 是    | 起始位置|
| count    | int | 是    | 需要获取的记录条数|

#### 返回结果说明

| 属性名称    | 类型         | 说明     |
| ------- | ---------- | ------ |
| code | int        | 返回码，0表示成功 |
| message | String | 描述信息 |
| rooms | List<Room> | 房间列表 |

#### Room 属性说明

| 属性名称    | 类型         | 说明     |
| ------- | ---------- | ------ |
| roomID | String   | 房间id |
| roomInfo | String | 房间名称 |

### get_room_members 获取房间内成员列表

#### 参数说明

| 参数名称   | 类型         | 是否必填 | 说明                 |
| ------ | ---------- | ---- | ------------------ |
| roomID | String   | 房间id |

#### 返回结果说明

| 属性名称    | 类型         | 说明     |
| ------- | ---------- | ------ |
| code | int        | 返回码，0表示成功 |
| message | String | 描述信息 |
| members | List<Member> | 成员列表 |

#### Member 属性说明

| 属性名称    | 类型         | 说明     |
| ------- | ---------- | ------ |
| userID | String   | 用户id |
| nickName | String | 用户昵称 |

