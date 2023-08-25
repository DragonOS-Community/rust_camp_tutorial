# Mini-Redis教程

## 准备工作

###  获取代码

```shell
git clone --recursive https://github.com/DragonOS-Community/rust_camp_code.git
```

教程版请切换curse-mini-redis分支

###  运行项目

####  运行服务端

```shell
RUST_LOG=debug cargo run --bin mini-redis-server
```

运行服务端之后，就可以运行redis操作的代码和redis的命令了。详情请参考example文件夹下的代码和redis的命令。

####  运行example的代码

```shell
cargo run --example hello_world
```

####  运行redis命令

```shell
cargo run --bin mini-redis-cli set foo bar

cargo run --bin mini-redis-cli get foo
```

##  Module

###  client

> 最小的redis会话。为所支持的命令提供异步连接。

代码位于src/clients/client.rs

####  Client

#####  Struct

用于建立和存储客户端连接

```rust
pub struct Client{
    /// 客户端连接
    connection:Connection,
}
```

#####  Implementation

```rust
impl Client{
    /// 建立连接
    pub async fn connect<T: ToSocketAddrs>(addr: T) -> crate::Result<Client> {
        // 与addr建立tcp连接并获取套接字
        let socket = TcpStream::connect(addr).await?;
        // 使用套接字建立连接
        let connection = Connection::new(socket);
        // 返回客户端
        Ok(Client { connection })
    }

    /// ping客户端
    #[instrument(skip(self))]
    pub async fn ping(&mut self, msg: Option<Bytes>) -> crate::Result<Bytes> {
        // 构建ping消息
        let frame = Ping::new(msg).into_frame();
        // 日志记录ping
        debug!(request = ?frame);
        // 发送ping消息
        self.connection.write_frame(&frame).await?;
        // 读取响应，对Frame::Simple、Frame::Bulk、error类型进行处理
        match self.read_response().await? {
            Frame::Simple(value) => Ok(value.into()),
            Frame::Bulk(value) => Ok(value),
            frame => Err(frame.to_error()),
        }
    }

    /// 获取key对应的value
    #[instrument(skip(self))]
    pub async fn get(&mut self,key:&str) -> Result<Option<Bytes>> {
        // 创建获取'key'的值的'Get'命令,并将其转换成frame格式
        let frame = Get::new(key).into_frame();
        // 日志记录frme
        debug!(request = ?frame);

        // 将frame通过连接异步写给套接字
        self.connection.write_frame(&frame).await?;

        // 异步读响应,并匹配Simple、Bulk、NUll的情况
        match self.read_response().await? {
            Frame::Simple(value) => Ok(Some(value.into())),
            Frame::Bulk(value) => Ok(Some(value)),
            Frame::Null => Ok(None),
            frame => Err(frame.to_error()),
        }
    }

    /// 设置key对应的value
    #[instrument(skip(self))]
    pub async fn set(&mut self, key: &str, value: Bytes) -> crate::Result<()> {
        // 通过set_cmd异步创建过期时间为None的Set命令
        self.set_cmd(Set::new(key, value, None)).await
    }

    /// 设置key对应的value，value在expiration后过期
    #[instrument(skip(self))]
    pub async fn set_expires(
        &mut self,
        key: &str,
        value: Bytes,
        expiration: Duration) -> crate::Result<()>{
        // 通过set_cmd异步创建过期时间为expiration的Set命令
        self.set_cmd(Set::new(key, value, Some(expiration))).await
    }

    /// Set命令的主要逻辑
    async fn set_cmd(&mut self, cmd: Set) -> crate::Result<()> {
        // 将cmd转化为frame的形式
        let frame = cmd.into_frame();
        // 将frame写入连接
        self.connection.write_frame(&frame).await?;
        // 读取对frame的响应，并匹配响应状态
        // 执行成功响应为"OK"
        // 其他响应均为失败
        match self.read_response().await? {
            Frame::Simple(response) if response == "OK" => Ok(()),
            frame => Err(frame.to_error()),
        }    
    }

    /// 将信息推送给指定的频道
    #[instrument(skip(self))]
    pub async fn publish(&mut self, channel: &str, message: Bytes) -> crate::Result<u64> {
        // 将Publish命令转成frame的格式
        let frame = Publish::new(channel, message).into_frame();

        // 日志记录frme
        debug!(request = ?frame);

        // 将frame通过连接异步写给套接字
        self.connection.write_frame(&frame).await?;

        // 异步读请求，并匹配请求类型
        // 如果是整数帧，则返回OK(response)
        // 否则返回错误
        match self.read_response().await? {
            Frame::Integer(response) => Ok(response),
            frame => Err(frame.to_error()),
        }
    }

    /// SUBSCRIBE的主要逻辑
    async fn subscribe_cmd(&mut self, channels: &[String]) -> crate::Result<()> {
        // 将Subscribe命令转成frame的格式
        let frame = Subscribe::new(channels.to_vec()).into_frame();

        // 日志记录frme
        debug!(request = ?frame);

        // 将frame通过连接异步写给套接字
        self.connection.write_frame(&frame).await?;

        // 遍历channels，服务端通过响应确认订阅每个频道
        for channel in channels {
            // 获取响应
            let response = self.read_response().await?;

            // 分析不同情况的响应
            match response {
                Frame::Array(ref frame) => match frame.as_slice() {
                    [subscribe, schannel, ..]
                        if *subscribe == "subscribe" && *schannel == channel => {}
                    _ => return Err(response.to_error()),
                },
                frame => return Err(frame.to_error()),
            };
        }

        Ok(())
    }

    /// 监听若干个指定的频道
    #[instrument(skip(self))]
    pub async fn subscribe(mut self, channels: Vec<String>) -> crate::Result<Subscriber> {
        // 异步调用subscribe_cmd，客户端状态将会转为subscriber
        self.subscribe_cmd(&channels).await?;

        // 返回Subscriber类型对象
        Ok(Subscriber {
            client: self,
            subscribed_channels: channels,
        })
    }

    /// 读取响应
    async fn read_response(&mut self) -> crate::Result<Frame> {
        // 异步读取连接的frame
        let response = self.connection.read_frame().await?;
        // 日志记录读取信息
        debug!(?response);

        // 解析响应，判断响应的类型
        // Some(Frame::Error(msg))
        // Some(frame)
        // None：响应为None意味着服务端关闭
        match response {
            // Error frames are converted to `Err`
            Some(Frame::Error(msg)) => Err(msg.into()),
            Some(frame) => Ok(frame),
            None => {
                // Receiving `None` here indicates the server has closed the
                // connection without sending a frame. This is unexpected and is
                // represented as a "connection reset by peer" error.
                let err = Error::new(ErrorKind::ConnectionReset, "connection reset by server");

                Err(err.into())
            }
        }

    }
}
```

####  Message

#####  Struct

```rust
/// A message received on a subscribed channel.
#[derive(Debug, Clone)]
pub struct Message {
    pub channel: String,
    pub content: Bytes,
}
```

####  Subscriber

> 订阅者类型，在客户端订阅若干频道后会转变成订阅者，此时只能执行publish/subscribe相关的命令

代码位置：src/clients/client.rs

#####  Struct

```rust
pub struct Subscriber {
    /// 客户端
    client: Client,
    /// 所订阅的频道集合
    subscribed_channels: Vec<String>,
}
```

#####  Implementation

```rust
impl Subscriber{
    /// 获取订阅的频道集合
    pub fn get_subscribed(&self) -> &[String] {
        &self.subscribed_channels
    }

    /// 获取客户端收到的下一条消息（可能需要等待）
    pub async fn next_message(&mut self) -> crate::Result<Option<Message>> {
        match self.client.connection.read_frame().await? {
            Some(mframe) => {
                // 使用日志记录mframe
                debug!(?mframe);
                match mframe {
                    Frame::Array(ref frame) => match frame.as_slice() {
                      // frame分片后格式为[message,channel,content]
                      // 当接收到信息时，message == 'message'
                      // 成立则将信息转化为Message的形式返回
                      // 否则返回错误
                      [message, channel, content] if *message == "message" => Ok(Some(Message {
                            channel: channel.to_string(),
                            content: Bytes::from(content.to_string()),
                        })),
                        _ => Err(mframe.to_error()),
                    },
                    frame => Err(frame.to_error()),
                }
            }
            None => Ok(None),
        }
    }

    /// 将收到的message转换成stream形式
    pub fn into_stream(mut self) -> impl Stream<Item = crate::Result<Message>> {
        try_stream! {
            while let Some(message) = self.next_message().await? {
                yield message;
            }
        }
    }

    /// 订阅新的频道集合
    #[instrument(skip(self))]
    pub async fn subscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        // 调用subscribe_cmd，订阅新的频道集合
        self.client.subscribe_cmd(channels).await?;

        // 更新当前的已订阅频道
        self.subscribed_channels
            .extend(channels.iter().map(Clone::clone));

        Ok(())
    }

    /// 取消订阅指定的频道
    #[instrument(skip(self))]
    pub async fn unsubscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        // 创建Unsubcribe命令，并转为frame形式
        let frame = Unsubscribe::new(channels).into_frame();
        // 日志记录请求
        debug!(request = ?frame);

        // 将请求写入连接
        self.client.connection.write_frame(&frame).await?;

        // 如果channels为空，那么取消订阅所有频道
        // 否则只取消channels中指定的频道
        let num = if channels.is_empty() {
            self.subscribed_channels.len()
        } else {
            channels.len()
        };

        // 解析响应
        for _ in 0..num {
            // 读取响应
            todo!();
            // 判断响应类型
            match response {
                Frame::Array(ref frame) => match frame.as_slice() {
                    // frame分片后格式为['unsubscribe',channel,..]
                    // 判断是否取消订阅
                    [unsubscribe, channel, ..] if *unsubscribe == "unsubscribe" => {
                       // 获取当前订阅数组的长度
                        let len = self.subscribed_channels.len();
                        // 长度为0，返回错误
                        if len == 0 {
                            // There must be at least one channel
                            return Err(response.to_error());
                        }
                        // 当channel存在于subscribed_channels时将其删除
                        self.subscribed_channels.retain(|c| *channel != &c[..]);

                        // 删除数大于1则返回错误
                        if self.subscribed_channels.len() != len - 1 {
                            return Err(response.to_error());
                        }                    }
                    _ => return Err(response.to_error()),
                },
                frame => return Err(frame.to_error()),
            };
        }

        Ok(())
    }   
}
```

###  blocking_client

> 最小的阻塞性Redis客户端

代码位置：src/clients/blocking_client.rs

####  BlockingClient

#####  Struct

```rust
pub struct BlockingClient{
     /// 异步的客户端
     inner: crate::clients::Client,
     /// 运行时环境，负责调度和管理异步任务的执行
     rt: Runtime,
}
```

#####  Implementation

```rust
impl BlockingClient{
    /// 建立连接
    pub fn connect<T: ToSocketAddrs>(addr: T) -> crate::Result<BlockingClient> {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()?;

        let inner = rt.block_on(crate::clients::Client::connect(addr))?;

        Ok(BlockingClient { inner, rt })
    }    

    /// 异步获取指定值
    pub fn get(&mut self, key: &str) -> crate::Result<Option<Bytes>> {
        // 异步调用get获取key对应的值
        self.rt.block_on(self.inner.get(key))
    }

    /// 异步给key赋值
    pub fn set(&mut self, key: &str, value: Bytes) -> crate::Result<()> {
        // 异步调用set给key赋值
        self.rt.block_on(self.inner.set(key, value))
    }    

   /// 异步给key赋值，并指定过期时间
       pub fn set_expires(
        &mut self,
        key: &str,
        value: Bytes,
        expiration: Duration,
    ) -> crate::Result<()> {
        // 异步调用set_expires给key赋值
        self.rt
            .block_on(self.inner.set_expires(key, value, expiration))    }

    /// 异步推送消息
    pub fn publish(&mut self, channel: &str, message: Bytes) -> crate::Result<u64> {
        // 异步调用publish给指定channel推送消息
        self.rt.block_on(self.inner.publish(channel, message))
    }

    /// 异步执行订阅指定频道操作，并将Client转换为BlockingSubcriber状态
    pub fn subscribe(self, channels: Vec<String>) -> crate::Result<BlockingSubscriber> {
        // 异步调用subscribe函数，转换client状态
        let subscriber = self.rt.block_on(self.inner.subscribe(channels))?;
        // 返回BlockingSubscriber
        Ok(BlockingSubscriber {
            inner: subscriber,
            rt: self.rt,
        })
    }    
}
```

####  BlockingSubscriber

#####  Struct

```rust
pub struct BlockingSubscriber {
    /// 异步的订阅者
    inner: crate::clients::Subscriber,
    /// 运行时环境，负责调度和管理异步任务的执行
    rt: Runtime,
}
```

#####  Implementation

```rust
impl BlockingSubscriber{
    /// 获取订阅的channel集合
    pub fn get_subscribed(&self) -> &[String] {
        // 获取订阅的channel集合，并返回
        self.inner.get_subscribed()
    }

       /// 异步接收下一条信息
       pub fn next_message(&mut self) -> crate::Result<Option<Message>> {
        // 异步执行获取下一条信息的操作
        self.rt.block_on(self.inner.next_message())
    }

    /// 异步订阅新的频道集合
    pub fn subscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        // 异步订阅新的频道集合
        self.rt.block_on(self.inner.subscribe(channels))
    }

    /// 异步执行取消订阅指定频道集操作
    pub fn unsubscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        // 异步执行取消订阅指定频道集操作
        self.rt.block_on(self.inner.unsubscribe(channels))
    }

    /// 获取BlockingSubscriber的迭代器
    pub fn into_iter(self) -> impl Iterator<Item = crate::Result<Message>> {
        SubscriberIterator {
            inner: self.inner,
            rt: self.rt,
        }
    }
}
```

####  SubscriberIterator

#####  Struct

```rust
/// BlockingSubscriber的迭代器
/// 通过`Subscriber::into_iter`可以获取
struct SubscriberIterator {
    /// BlockingSubscriber中的Subscriber
    inner: crate::clients::Subscriber,

    /// BlockingSubscriber中的Runtime
    rt: Runtime,
}
```

#####  Implementation

```rust
impl Iterator for SubscriberIterator {
    /// 定义迭代器的元素类型
    type Item = crate::Result<Message>;

    /// 获取迭代器的下一个元素
    /// 返回Some(Ok(message)) 表示存在下一个元素
    /// 返回Some(Err(error)) 表示获取下一个元素出错
    /// 返回None 表示没有下一个元素
    fn next(&mut self) -> Option<crate::Result<Message>>
    {
        self.rt.block_on(self.inner.next_message()).transpose()
    }
}
```

###  cmd

####  Get

> 获取key对应的value

- 如果key不存在，返回nil
- 如果value不是string类型，返回error

代码位置：src/cmd/get.rs

#####  Struct

```rust
#[derive(Debug)]
pub struct Get {
    /// Name of the key to get
    key: String,
}
```

#####  Implementation

```rust
impl Get{
    /// 创建一个Get命令对象
    pub fn new(key: impl ToString) -> Get {
        Get {
            key: key.to_string(),
        }
    }

    /// Get the key
    pub fn key(&self) -> &str {
        &self.key
    }

    /// 解析frame，并获取对应Get命令
    pub(crate) fn parse_frames(parse: &mut Parse) -> crate::Result<Get> {
        let key = parse.next_string()?;
        Ok(Get { key })
    }

    /// 对数据库执行Get命令
    #[instrument(skip(self, db, dst))]
    pub(crate) async fn apply(self, db: &Db, dst: &mut Connection) -> crate::Result<()> {
        // 从数据库中获取value
        // 如果值存在，则将其转成Frame::Bulk形式
        // 否则转成Frame::Null
        let response = if let Some(value) = db.get(&self.key) {
            // If a value is present, it is written to the client in "bulk"
            // format.
            Frame::Bulk(value)
        } else {
            // If there is no value, `Null` is written.
            Frame::Null
        };

        // 日志记录响应
        debug!(?response);

        // 将响应写入连接
        dst.write_frame(&response).await?;

        Ok(())
    }

    /// 将命令转成Frame格式，在客户端将格式化的Get
    ///命令发给服务端时会调用。
    pub(crate) fn into_frame(self) -> Frame {
        let mut frame = Frame::array();
        /// 将命令以["get",key]的形式放入frame。注意每个元素都要转成字节形式
        todo!();
        frame
    }
}
```

####  Publish

代码位置：src/cmd/publish.rs

#####  Struct

```rust
/// 向指定频道推送消息
#[derive(Debug)]
pub struct Publish {
    /// 频道名
    channel: String,

    /// 要发送的消息
    message: Bytes,
}
```

#####  Implementation

```rust
impl Publish{
    /// 创建Publish命令
    pub(crate) fn new(channel: impl ToString, message: Bytes) -> Publish {
        Publish {
            channel: channel.to_string(),
            message,
        }
    }

    /// 解析frame，并获取对应Publish命令
    pub(crate) fn parse_frames(parse: &mut Parse) -> crate::Result<Publish> {
        // 获取string形式的channel
        let channel = parse.next_string()?;

        // 获取字节形式的message
        let message = parse.next_bytes()?;

        // 返回对应Publish
        Ok(Publish { channel, message })
    }

    /// 对数据库执行publish命令
    pub(crate) async fn apply(self, db: &Db, dst: &mut Connection) -> crate::Result<()>{
        // 向数据库连接执行publish操作，并获取到订阅channel的subscriber的数量
        let num_subscribers = db.publish(&self.channel, self.message);

        // 将subscriber_num转换成整数帧，并将其写入连接
        let response = Frame::Integer(num_subscribers as u64);
        dst.write_frame(&response).await?;

        Ok(())
    }

    /// 将publish命令转成frame的形式
    pub(crate) fn into_frame(self) -> Frame {
        let mut frame = Frame::array();
        // 将publish命令以["publish",channel,message]的形式写入数组。注意每个元素都要转成字节形式
        frame.push_bulk(Bytes::from("publish".as_bytes()));
        frame.push_bulk(Bytes::from(self.channel.into_bytes()));
        frame.push_bulk(self.message);

        frame
    }
}
```

####  Set

代码位置：src/cmd/set.rs

#####  Struct

```rust
/// 设置key的值
#[derive(Debug)]
pub struct Set {
    /// the lookup key
    key: String,

    /// the value to be stored
    value: Bytes,

    /// When to expire the key
    expire: Option<Duration>,
}
```

#####  Implementation

```rust
impl Set{
    /// 创建一个set命令
    /// 
    /// 如果不需要过期时间则expire为None
    pub fn new(key: impl ToString, value: Bytes, expire: Option<Duration>) -> Set {
        Set {
            key: key.to_string(),
            value,
            expire,
        }
    }

    /// Get the key
    pub fn key(&self) -> &str {
        &self.key
    }

    /// Get the value
    pub fn value(&self) -> &Bytes {
        &self.value
    }

    /// Get the expire
    pub fn expire(&self) -> Option<Duration> {
        self.expire
    }

    /// 解析frame
    pub(crate) fn parse_frames(parse: &mut Parse) -> crate::Result<Set> {
        use ParseError::EndOfStream;

        // 使用 parse.next_string() 方法读取下一个字符串字段作为键（key）。
        let key = parse.next_string()?;

        // 使用 parse.next_bytes() 方法读取下一个字节字段作为值（value）。
        let value = parse.next_bytes()?;

        // 创建一个mut expire，用于存储过期时间。初始值为 None。
        let mut expire = None;

        // 分析其他情况的帧
        match parse.next_string() {
            Ok(s) if s.to_uppercase() == "EX" => {
                // 如果下一个字符串字段是 "EX"（不区分大小写），则表示设置了过期时间且单位是secs
                // 下一个值应该是一个整数，并转成Duration类型。
                let secs = parse.next_int()?;
                expire = Some(Duration::from_secs(secs));
            }
            Ok(s) if s.to_uppercase() == "PX" => {
                // 如果下一个字符串字段是 "PX"（不区分大小写），则表示设置了过期时间且单位是millis
                // 下一个值应该是一个整数，并转成Duration类型。
                let ms = parse.next_int()?;
                expire = Some(Duration::from_millis(ms));
            }
            // 如果下一个字符串字段不是 "EX" 或 "PX"，则表示设置了不支持的选项，将返回一个错误，指示 SET 目前仅支持过期时间选项。
            Ok(_) => return Err("currently `SET` only supports the expiration option".into()),
            // 如果解析到达流的末尾，表示没有进一步的数据需要解析，这是正常的运行时情况，表示没有指定 SET 的选项。
            Err(EndOfStream) => {}
            // 其他所有错误都会返回一个错误，导致连接被终止。
            Err(err) => return Err(err.into()),
        }

        Ok(Set { key, value, expire })
    }

    /// 对数据库连接执行set命令
    #[instrument(skip(self, db, dst))]
    pub(crate) async fn apply(self, db: &Db, dst: &mut Connection) -> crate::Result<()> {
        // 执行set
        db.set(self.key, self.value, self.expire);

        // 创建执行成功响应，并写给连接
        let response = Frame::Simple("OK".to_string());
        debug!(?response);
        dst.write_frame(&response).await?;

        Ok(())
    }

    /// 将set命令转成frame形式
    pub(crate) fn into_frame(self) -> Frame {
        let mut frame = Frame::array();
        // 将命令以["set",key,value]的形式写入frame
        frame.push_bulk(Bytes::from("set".as_bytes()));
        frame.push_bulk(Bytes::from(self.key.into_bytes()));
        frame.push_bulk(self.value);
        // 判断是否有过期时间，如果有过期时间以["px",ms]的格式写入frame
        if let Some(ms) = self.expire {
            // 可以用以下两种方式设置过期时间，在这里使用第二种，因为精度更高
            // 1. SET key value EX seconds
            // 2. SET key value PX milliseconds
            frame.push_bulk(Bytes::from("px".as_bytes()));
            frame.push_int(ms.as_millis() as u64);
        }
        frame
    }
}
```

####  Subscribe+Message

代码位置：src/cmd/subscribe.rs

#####  Struct

```rust
/// 订阅命令
/// 
/// 一旦客户端进入订阅状态，它只能提出 
/// SUBSCRIBE, PSUBSCRIBE, UNSUBSCRIBE,
/// PUNSUBSCRIBE, PING 和 QUIT命令
#[derive(Debug)]
pub struct Subscribe {
    channels: Vec<String>,
}

/// 信息流
type Messages = Pin<Box<dyn Stream<Item = Bytes> + Send>>;
```

#####  Implementation

```rust
impl Subscribe{
    /// 创建一个新的订阅者以监听频道
    pub(crate) fn new(channels: &[String]) -> Subscribe {
        Subscribe {
            channels: channels.to_vec(),
        }
    }
     /// 解析subscribe帧
     pub(crate) fn parse_frames(parse: &mut Parse) -> crate::Result<Subscribe> {
        use ParseError::EndOfStream;
        // 获取第一个channel，并判断是否为none，不为none则写入数组
        let mut channels = vec![parse.next_string()?];
        // 循环解析剩下的channel，并将其写入数组
        loop {
            match parse.next_string() {
                // 推送消息给频道
                Ok(s) => channels.push(s),
                // EndOfStream说明不会再有消息了
                Err(EndOfStream) => break,
                // 错误报告
                Err(err) => return Err(err.into()),
            }
        }
        // 返回结果
        Ok(Subscribe { channels })
    }

    /// 数据库执行subscribe命令
    pub(crate) async fn apply(
        mut self,
        db: &Db,
        dst: &mut Connection,
        shutdown: &mut Shutdown,
    ) -> crate::Result<()> {
        // 创建一个 StreamMap 对象，用于跟踪活动的订阅。使用map可以防止订阅重复
        let mut subscriptions = StreamMap::new();

        loop {
            // 遍历channels，drain(..)会将管道从channels中移除
            // subscribe_to_channel会订阅传入的管道
            // await等待管道订阅成功
            for channel_name in self.channels.drain(..) {
                subscribe_to_channel(channel_name, &mut subscriptions, db, dst).await?;
            }

            // 使用 select! 宏等待以下几种情况中的任何一种发生：
            // 1. 从已订阅的通道接收到消息。
            // 2. 从客户端接收到订阅或取消订阅命令。
            // 3. 收到服务器关闭信号。
            select! {
                // 接收来自已订阅通道的消息。
                // subscriptions.next() 返回一个异步迭代器
                // 当有新的消息到达时，会返回 Some((channel_name, msg))
                // 其中 channel_name 是通道名称，msg 是消息内容。
                Some((channel_name, msg)) = subscriptions.next() => {
                    // 将收到的消息构造成消息帧写给客户端
                    dst.write_frame(&make_message_frame(channel_name, msg)).await?;
                }
                // dst.read_frame() 返回一个异步操作结果，
                //当有新的帧可用时，会返回 Some(frame)，其中 frame 是读取到的帧。如果客户端断开连接，会返回 None。
                res = dst.read_frame() => {
                    let frame = match res? {
                        Some(frame) => frame,
                        // This happens if the remote client has disconnected.
                        None => return Ok(())
                    };
                    // 处理从客户端接收到的命令帧
                    handle_command(
                        frame,
                        &mut self.channels,
                        &mut subscriptions,
                        dst,
                    ).await?;
                }
                // 接收服务器关闭信号。
                _ = shutdown.recv() => {
                    return Ok(());
                }
            };
        }
    }

    /// 将命令转为frame类型
    pub(crate) fn into_frame(self) -> Frame {
        let mut frame = Frame::array();
        // 将命令以["subscribe",channel1,channel2...]的形
        //式放入数组
        frame.push_bulk(Bytes::from("unsubscribe".as_bytes()));
        for channel in self.channels {
            frame.push_bulk(Bytes::from(channel.into_bytes()));
        }
        frame
    }



}
```

#####  Function

```rust
async fn subscribe_to_channel(
    channel_name: String,
    subscriptions: &mut StreamMap<String, Messages>,
    db: &Db,
    dst: &mut Connection,
) -> crate::Result<()> {
    // 向数据发送订阅请求
    let mut rx = db.subscribe(channel_name.clone());

    // 接受订阅回复
    let rx = Box::pin(async_stream::stream! {
        loop {
            match rx.recv().await {
                Ok(msg) => yield msg,
                // If we lagged in consuming messages, just resume.
                Err(broadcast::error::RecvError::Lagged(_)) => {}
                Err(_) => break,
            }
        }
    });

    // 将订阅成功的管道加入到订阅map中
    subscriptions.insert(channel_name.clone(), rx);

    // 响应成功订阅报文
    let response = make_subscribe_frame(channel_name, subscriptions.len());
    dst.write_frame(&response).await?;

    Ok(())
}

/// 处理subscribe和unsubscibe的逻辑
async fn handle_command(
    frame: Frame,
    subscribe_to: &mut Vec<String>,
    subscriptions: &mut StreamMap<String, Messages>,
    dst: &mut Connection,
) -> crate::Result<()> {
    // 匹配命令，判断要执行的操作
    match Command::from_frame(frame)? {
        Command::Subscribe(subscribe) => {
        // 将要订阅的频道加入到订阅map          
            subscribe_to.extend(subscribe.channels.into_iter());
        }
        Command::Unsubscribe(mut unsubscribe) => {
            // 判断是否指定了要取消订阅的频道
            // 如果没有则需要订阅所有channels
            if unsubscribe.channels.is_empty() {
                unsubscribe.channels = subscriptions
                    .keys()
                    .map(|channel_name| channel_name.to_string())
                    .collect();
            }
            // 将需要取消订阅的频道从map中移除
            for channel_name in unsubscribe.channels {
                  subscriptions.remove(&channel_name);
                  // 生成unsubscribe响应
                  let response = make_unsubscribe_frame(channel_name, subscriptions.len());
                  // 写入unsubscribe响应
                  dst.write_frame(&response).await?;
            }
        }
        command => {
            // 其他命令都看作是unknown命令
            let cmd = Unknown::new(command.get_name());
            cmd.apply(dst).await?;
        }
    }
    Ok(())
}
```

####  Unsubscribe

代码位置：src/cmd/subcribe.rs

#####  Struct

```rust
/// 取消订阅命令
///
/// 如果channels为空，则取消订阅所有频道
#[derive(Clone, Debug)]
pub struct Unsubscribe {
    channels: Vec<String>,
}
```

#####  Implementation

```rust
impl Unsubscribe{
     pub(crate) fn new(channels: &[String]) -> Unsubscribe {
        Unsubscribe {
            channels: channels.to_vec(),
        }
    }
    /// 解析unsubscribe帧
    pub(crate) fn parse_frames(parse: &mut Parse) -> Result<Unsubscribe, ParseError> {
        use ParseError::EndOfStream;

        // 创建数组，用于存储channels
        let mut channels = vec![];

        // 循环解析数据，将channel放入数组
        loop {
            match parse.next_string() {
                // 将数据推送到要取消订阅的频道列表
                Ok(s) => channels.push(s),
                // EndOfStream代表数据解析完成
                Err(EndOfStream) => break,
                // 其他错误
                Err(err) => return Err(err),
            }
        }

        // 返回命令
    }
    /// 将unsubscribe命令转成帧
    pub(crate) fn into_frame(self) -> Frame {
        let mut frame = Frame::array();
        // 将命令以["unsubscribe",channel1,channel2...]形
        // 式放入数组
        frame.push_bulk(Bytes::from("unsubscribe".as_bytes()));

        for channel in self.channels {
            frame.push_bulk(Bytes::from(channel.into_bytes()));
        }
        frame
    }
}
```

####  Unknown

#####  Struct

```rust
#[derive(Debug)]
pub struct Unknown {
    command_name: String,
}
```

#####  Implementation

```rust
impl Unknown{
    /// 创建unknown命令
    pub(crate) fn new(key: impl ToString) -> Unknown {
        Unknown {
            command_name: key.to_string(),
        }
    }

    /// 获取命令名
    pub(crate) fn get_name(&self) -> &str {
        &self.command_name
    }

    /// 回应客户端不支持当前命令
    #[instrument(skip(self, dst))]
    pub(crate) async fn apply(self, dst: &mut Connection) -> crate::Result<()> {
        // 生成错误帧响应
        let response = Frame::Error(format!("ERR unknown command '{}'", self.command_name));
        // 日志记录响应
        debug!(?response);
        // 将帧写入连接
        dst.write_frame(&response).await?;
        Ok(())
    }
}
```

####  Ping

#####  Struct

```rust
#[derive(Debug, Default)]
pub struct Ping {
    /// 自定义消息返回
    msg: Option<Bytes>,
}
```

#####  Implement

```rust
impl Ping {
    /// 创建一个新的携带自定信息的Ping命令
    pub fn new(msg: Option<Bytes>) -> Ping {
        Ping { msg }
    }

    /// 解析ping命令
    pub(crate) fn parse_frames(parse: &mut Parse) -> crate::Result<Ping> {
        match parse.next_bytes() {
            Ok(msg) => Ok(Ping::new(Some(msg))),
            Err(ParseError::EndOfStream) => Ok(Ping::default()),
            Err(e) => Err(e.into()),
        }
    }

    /// ping命令执行逻辑
    ///
    /// 响应会被写入dst。
    /// 服务端受到命令并执行时会执行。
    #[instrument(skip(self, dst))]
    pub(crate) async fn apply(self, dst: &mut Connection) -> crate::Result<()> {
        let response = match self.msg {
            None => Frame::Simple("PONG".to_string()),
            Some(msg) => Frame::Bulk(msg),
        };

        debug!(?response);

        dst.write_frame(&response).await?;

        Ok(())
    }

    /// 将命令转换成frame
    ///This is called by the client when encoding a `Ping` command to send
    /// to the server.
    /// 当客户端需要发送ping命令给服务端时会被调用
    pub(crate) fn into_frame(self) -> Frame {
        let mut frame = Frame::array();
        frame.push_bulk(Bytes::from("ping".as_bytes()));
        if let Some(msg) = self.msg {
            frame.push_bulk(msg);
        }
        frame
    }
}
```

###  frame

> redis协议帧

####  enum

```rust
/// A frame in the Redis protocol.
#[derive(Clone, Debug)]
pub enum Frame {
    Simple(String),
    Error(String),
    Integer(u64),
    Bulk(Bytes),
    Null,
    Array(Vec<Frame>),
}

#[derive(Debug)]
pub enum Error {
    /// Not enough data is available to parse a message
    Incomplete,

    /// Invalid message encoding
    Other(crate::Error),
}
```

###  sever

> mini-redis的服务端。提供了一个异步的`run`函数，用于监听连接，并为每个连接生成一个任务

####  Listener

#####  Struct

```rust
/// 服务端用于监听的连接
#[derive(Debug)]
struct Listener {
    /// 可共享的数据库连接句柄（Arc形式）
    db_holder: DbDropGuard,

    /// TCP监听类，由run函数提供
    listener: TcpListener,

    /// 信号量，用于限制连接数
    limit_connections: Arc<Semaphore>,

    /// 用于广播shutdown信号
    notify_shutdown: broadcast::Sender<()>,

    /// 用于在客户端完成所有任务后安全关闭连接。
    /// 当一个连接被初始化，它会保存‵shutdown_complete_tx‵的clone，被关闭时回收
    /// 当所有listener的连接都被关闭后，sender也会被释放
    /// 所有任务被完成后，`shutdown_complete_rx.recv()`会返回`None`
    shutdown_complete_tx: mpsc::Sender<()>,
}
```

#####  Implementation

```rust
impl Listener {
    /// 启动server监听服务
    async fn run(&mut self) -> crate::Result<()> {
        info!("accepting inbound connections");

        loop {
            // 等待有名额创建连接
            let permit = self
                .limit_connections
                .clone()
                .acquire_owned()
                .await
                .unwrap();

            // 建立tcp连接，获取套接字
            let socket = self.accept().await?;

            // 存储连接状态
            let mut handler = Handler {
                // 获取数据库连接
                db: self.db_holder.db(),

                // 新建连接
                connection: Connection::new(socket),

                // 用于接受shutdown信号
                shutdown: Shutdown::new(self.notify_shutdown.subscribe()),

                // 一旦所有的clone被释放，会通过此成员来通知
                _shutdown_complete: self.shutdown_complete_tx.clone(),
            };

                // 创建一个异步的任务执行连接要做的操作
                tokio::spawn(async move {
                // 执行连接，并记录错误
                if let Err(err) = handler.run().await {
                    error!(cause = ?err, "connection error");
                }
                // 归还连接名额
                drop(permit);
            });
        }
    }

    /// 建立tcp连接，获取套接字
    /// 如果发生错误，最大重连次数为6，最后一次等待时间为64s。重连流程参考tcp超时重发机制。
    async fn accept(&mut self) -> crate::Result<TcpStream> {
        let mut backoff = 1;

        // 尝试接受连接
        loop {
            // 成功直接返回tcp连接 失败返回错误信息
            match self.listener.accept().await {
                Ok((socket, _)) => return Ok(socket),
                Err(err) => {
                    if backoff > 64 {
                        // 等待时间过长，返回错误
                        return Err(err.into());
                    }
                }
            }

            // 睡眠
            time::sleep(Duration::from_secs(backoff)).await;

            // 指数增长等待时间
            backoff *= 2;
        }
    }
}
```

####  Handler

#####  Struct

```rust
/// 服务端的具体连接
#[derive(Debug)]
struct Handler {
    /// 数据库连接
    db: Db,

    /// tcp连接
    connection: Connection,

    /// 监听shutdown信号
    shutdown: Shutdown,

    /// 不直接使用，用来判断当前类对象是否被释放
    _shutdown_complete: mpsc::Sender<()>,
}
```

#####  Implementation

```rust
impl Handler {
    /// 处理单个连接
    /// 
    /// 当接收到shutdown信号时，等到该连接处于安全状态时，连接会断开
    #[instrument(skip(self))]
    async fn run(&mut self) -> crate::Result<()> {
        // 循环处理帧
        while !self.shutdown.s_shutdown() {
            let maybe_frame = tokio::select! {
                res = self.connection.read_frame() => res?,
                _ = self.shutdown.recv() => {
                    // 接收到shutdown信号，退出run函数会使任务结束
                    return Ok(());
                }
            };

            // 判断从远端收到的帧（maybe_frame）是否有内容，收到‵None`时说明远端关闭
            let frame = match maybe_frame {
                Some(frame) => frame,
                None => return Ok(()),
            };

            // 将frame转为命令形式
            let cmd = Command::from_frame(frame)?;

            // 日志记录接收到的命令
            debug!(?cmd);

            // 异步执行命令
            cmd.apply(&self.db, &mut self.connection, &mut self.shutdown)
                .await?;
        }

        Ok(())
    }
}
```

####  Fn Run

```rust
/// mini-redis的服务端启动函数
pub async fn run(listener: TcpListener, shutdown: impl Future) {
    // 初始化shutdown信号广播管道
    let (notify_shutdown, _) = broadcast::channel(1);
    // 初始化shutdown关闭机制
    let (shutdown_complete_tx, mut shutdown_complete_rx) = mpsc::channel(1);

    // 初始化监听连接
    let mut server = Listener {
        listener,
        db_holder: DbDropGuard::new(),
        limit_connections: Arc::new(Semaphore::new(MAX_CONNECTIONS)),
        notify_shutdown,
        shutdown_complete_tx,
    };

    // 监听是否有连接到达
    tokio::select! {
        res = server.run() => {
            // 处理连接失败的情况
            if let Err(err) = res {
                error!(cause = %err, "failed to accept");
            }
        }
        _ = shutdown => {
            info!("shutting down");
        }
    }

    let Listener {
        shutdown_complete_tx,
        notify_shutdown,
        ..
    } = server;

    // 所有的处在subscribe状态的任务会接收到shutdown信号并且退出
    drop(notify_shutdown);
    // 回收监听者的shutdown_complete_tx，意味着只有其他连接持有shutdown_complete_tx了
    drop(shutdown_complete_tx);

    // 等待所有活跃连接完成其任务
    // 当所有shutdown_complete_tx都被释放，说明所有连接都断开了
    // 此时`recv()`会返回`None`并且`mpsc`管道会被关闭
    let _ = shutdown_complete_rx.recv().await;
}
```

##  Function

###  Fn Buffer

```rust
/// 创建一个请求缓冲区
pub fn buffer(client: Client) -> Buffer {
    // 创建一个容量为32的异步通道。tx为发送端，rx为接收端
    let (tx, rx) = channel(32);

    // 使用 tokio::spawn 函数创建一个异步任务（task）
    // run 函数接受 client 和 rx（接收端）作为参数
    // 并在 await 关键字处暂停执行，直到接收端接收到消息。
    tokio::spawn(async move { run(client, rx).await });

    // 返回缓冲区
    Buffer { tx }
}
```

##  Struct

###  Buffer

####  struct

```rust
/// 客户端的请求窗口
#[derive(Clone)]
pub struct Buffer {
    tx: Sender<Message>,
}
```

####  Implementation

```rust
impl Buffer{
    /// 获取key的值。请求会被缓存直到连接能够发送请求
        pub async fn get(&mut self, key: &str) -> Result<Option<Bytes>> {
        // 初始化一个get命令
        let get = Command::Get(key.into());

        // 初始化一次性的管道以接收连接的回应
        let (tx, rx) = oneshot::channel();

        // 发送请求
        self.tx.send((get, tx)).await?;

        // 等待回应，并返回结果
        match rx.await {
            Ok(res) => res,
            Err(err) => Err(err.into()),
      }
    }

    /// 设置key的值
    pub async fn set(&mut self, key: &str, value: Bytes) -> Result<()> {
        // 初始化一个set命令
        let set = Command::Set(key.into(), value);

        // 初始化一次性的管道以接收连接的回应
        let (tx, rx) = oneshot::channel();

        // 发送请求
        self.tx.send((set, tx)).await?;

        // 等待回应，并返回结果
        match rx.await {
            Ok(res) => res.map(|_| ()),
            Err(err) => Err(err.into()),
        }
    }           
}
```

###  Connection

####  struct

```rust
/// 发送和接收来自远端的帧
#[derive(Debug)]
pub struct Connection {
    // 带有写入缓冲区的tcp流
    stream: BufWriter<TcpStream>,

    // 帧读缓冲区
    buffer: BytesMut,
}
```

####  Implementation

```rust
impl Connection{
    /// 创建新的连接并返回socket，同时初始化缓冲区
    pub fn new(socket: TcpStream) -> Connection {
        Connection {
            stream: BufWriter::new(socket),
            buffer: BytesMut::with_capacity(4 * 1024),
        }
    }

    /// 从tcp流中读取一个帧
    pub async fn read_frame(&mut self) -> crate::Result<Option<Frame>> {
        loop {
            // 解析并获取帧
            if let Some(frame) = self.parse_frame()? {
                return Ok(Some(frame));
            }
            // 尝试从socket中读取更多的数据，如果读到的字节数为0，说明流被关闭
            if 0 == self.stream.read_buf(&mut self.buffer).await? {
                // 如果缓冲区为空说明远端正常关闭，否则为远端发送rst保温
                if self.buffer.is_empty() {
                    return Ok(None);
                } else {
                    return Err("connection reset by peer".into());
                }
            }
        }
    }

    /// 解析并获取frame。
    /// 如果数据不够则返回 `Ok(None)`
    /// 如果数据不合理则返回Err
    fn parse_frame(&mut self) -> crate::Result<Option<Frame>> {
        use frame::Error::Incomplete;

        // 创建cursor用于追踪buffer中的数据位置
        let mut buf = Cursor::new(&self.buffer[..]);

        // 检查缓冲区中是否有足够的数据
        match Frame::check(&mut buf) {
            Ok(_) => {
                // 由于Frame::check()开始时会定位到缓冲区的末尾，所以可以获取到缓冲区的数据长度
                let len = buf.position() as usize;

                // 重置cursor位置
                buf.set_position(0);

                // 解析frame
                let frame = Frame::parse(&mut buf)?;

                // 从buffer中删除所有数据（因为已经被解析了）
                self.buffer.advance(len);

                // 返回frame
                Ok(Some(frame))
            }
            // 数据不足以解析成单独的帧，返回None，说明需要继续等待
            Err(Incomplete) => Ok(None),
            // 返回错误
            Err(e) => Err(e.into()),
        }
    }

    /// 向TCP流中写数据
    pub async fn write_frame(&mut self, frame: &Frame) -> io::Result<()> {
        match frame {
            Frame::Array(val) => {
                // 对帧类型前缀进行编码。对于数组，它是“*”。
                self.stream.write_u8(b'*').await?;

                // 写入数组长度
                self.write_decimal(val.len() as u64).await?;

                // 遍历并写入数组中每个元素
                for entry in &**val {
                    self.write_value(entry).await?;
                }
            }
            // 直接写入整个帧
            _ => self.write_value(frame).await?,
        }

        // 保证缓冲区都被写入套接字
        self.stream.flush().await
    }

    /// 将帧文字写入流
    async fn write_value(&mut self, frame: &Frame) -> io::Result<()> {
            // 判断帧的类型，将不同的帧按照格式写入流
            match frame {
            Frame::Simple(val) => {
                self.stream.write_u8(b'+').await?;
                self.stream.write_all(val.as_bytes()).await?;
                self.stream.write_all(b"\r\n").await?;
            }
            Frame::Error(val) => {
                self.stream.write_u8(b'-').await?;
                self.stream.write_all(val.as_bytes()).await?;
                self.stream.write_all(b"\r\n").await?;
            }
            Frame::Integer(val) => {
                self.stream.write_u8(b':').await?;
                self.write_decimal(*val).await?;
            }
            Frame::Null => {
                self.stream.write_all(b"$-1\r\n").await?;
            }
            Frame::Bulk(val) => {
                let len = val.len();

                self.stream.write_u8(b'$').await?;
                self.write_decimal(len as u64).await?;
                self.stream.write_all(val).await?;
                self.stream.write_all(b"\r\n").await?;
            }
            // 暂时不支持解析数组类型
            Frame::Array(_val) => unreachable!(),
        }

        Ok(())
    }

    /// 将十进制帧写入流
    async fn write_decimal(&mut self, val: u64) -> io::Result<()> {
        use std::io::Write;

        // 将数据转换成string
        let mut buf = [0u8; 20];
        let mut buf = Cursor::new(&mut buf[..]);
        write!(&mut buf, "{}", val)?;
        // 将数据写入流
        let pos = buf.position() as usize;
        self.stream.write_all(&buf.get_ref()[..pos]).await?;
        self.stream.write_all(b"\r\n").await?;

        Ok(())
    }
}
```
