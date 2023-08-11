# Module

## client

> 最小的redis会话。为所支持的命令提供异步连接。

### Client

#### Struct

用于建立和存储连接

```rust
pub struct Client{
    connection:Connection,
}
```

#### Implementations

```rust
impl Client{
    /// 获取key对应的value
    #[instrument(skip(self))]
    pub async fn get(&mut self,key:&str) -> Result<Option<Bytes>> {
        // 创建获取'key'的值的'Get'命令,并将其转换成frame格式
        todo!();
        // 日志记录frme
        // debug!(request = ?frame);

        // 将frame通过连接异步写给套接字
        // self.connection.write_frame(&frame).await?;

        // 异步读响应,并匹配Simple、Bulk、NUll的情况
        todo!();
    }

    /// 设置key对应的value
    #[instrument(skip(self))]
    pub async fn set(&mut self, key: &str, value: Bytes) -> crate::Result<()> {
        // 通过set_cmd异步创建过期时间为None的Set命令
        todo!();
    }

    /// 设置key对应的value，value在expiration后过期
    #[instrument(skip(self))]
    pub async fn set_expires(
        &mut self,
        key: &str,
        value: Bytes,
        expiration: Duration) -> crate::Result<()>{
        // 通过set_cmd异步创建过期时间为expiration的Set命令
        todo!();
    }

    /// Set命令的主要逻辑
    async fn set_cmd(&mut self, cmd: Set) -> crate::Result<()> {
        // 将cmd转化为frame的形式
        todo!();
        // 将frame写入连接
        todo!();
        // 读取对frame的响应，并匹配响应状态
        // 执行成功响应为"OK"
        // 其他响应均为失败
        todo!();
    }

    /// 将信息推送给指定的频道
    #[instrument(skip(self))]
    pub async fn publish(&mut self, channel: &str, message: Bytes) -> crate::Result<u64> {
        // 将Publish命令转成frame的格式
        todo!();

         // 日志记录frme
        // debug!(request = ?frame);

        // 将frame通过连接异步写给套接字
        todo!();

        // 异步读请求，并匹配请求类型
        // 如果是整数帧，则返回OK(response)
        // 否则返回错误
        todo!();
    }

    /// SUBSCRIBE的主要逻辑
    async fn subscribe_cmd(&mut self, channels: &[String]) -> crate::Result<()> {
        // 将Subscribe命令转成frame的格式
        todo!();

         // 日志记录frme
        // debug!(request = ?frame);

        // 将frame通过连接异步写给套接字
        todo!();

        // 遍历channels，服务端通过响应确认订阅每个频道
        todo!();

        Ok(())
    }

    /// 监听若干个指定的频道
    #[instrument(skip(self))]
    pub async fn subscribe(mut self, channels: Vec<String>) -> crate::Result<Subscriber> {
        // 异步调用subscribe_cmd，客户端状态将会转为subscriber
        todo!();

        // 返回Subscriber类型对象
        Ok(Subscriber {
            client: self,
            subscribed_channels: channels,
        })
    }

    /// 读取响应
    async fn read_response(&mut self) -> crate::Result<Frame> {
        // 异步读取连接的frame
        todo!();
        // 日志记录读取信息
        // debug!(?response);

        // 解析响应，判断响应的类型
        // Some(Frame::Error(msg))
        // Some(frame)
        // None：响应为None意味着服务端关闭
        todo!();

    }
}
```

### Message

#### Struct

```rust
/// A message received on a subscribed channel.
#[derive(Debug, Clone)]
pub struct Message {
    pub channel: String,
    pub content: Bytes,
}
```

### Subscriber

> 订阅者类型，在客户端订阅若干频道后会转变成订阅者，此时只能执行publish/subscribe相关的命令

#### Struct

```rust
pub struct Subscriber {
    /// 客户端
    client: Client,
    /// 所订阅的频道集合
    subscribed_channels: Vec<String>,
}
```

#### Implementations

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
                todo!();
                match mframe {
                    Frame::Array(ref frame) => match frame.as_slice() {
                      // frame分片后格式为[message,channel,content]
                      // 当接收到信息时，message == 'message'
                      // 成立则将信息转化为Message的形式返回
                      // 否则返回错误
                      todo!();
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
        todo!();

        // 更新当前的已订阅频道
       todo!();

        Ok(())
    }

    /// 取消订阅指定的频道
    #[instrument(skip(self))]
    pub async fn unsubscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        // 创建Unsubcribe命令，并转为frame形式
        todo!();
        // 日志记录请求
        todo!();

        // 将请求写入连接
        todo!();

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
                        todo!();
                        // 长度为0，返回错误
                        todo!();
                        // 当channel存在于subscribed_channels时将其删除
                        todo!();

                        // 删除数大于1则返回错误
                        todo!();
                    }
                    _ => return Err(response.to_error()),
                },
                frame => return Err(frame.to_error()),
            };
        }

        Ok(())
    }   
}
```

### Fn Connect

> 建立新的连接

```rust
pub async fn connect<T: ToSocketAddrs>(addr: T) -> crate::Result<Client> {
    // 通过addr建立Tcp连接
    todo!();
    // 新建Connection变量
    todo!();
    // 返回Client类型变量
    todo!();
}
```

## blocking_client

> 最小的阻塞性Redis客户端

### BlockingClient

#### Struct

```rust
pub struct BlockingClient{
     /// 异步的客户端
     inner: crate::client::Client,
     /// 运行时环境，负责调度和管理异步任务的执行
     rt: Runtime,
}
```

#### Implementations

```rust
impl BlockingClient{
    /// 异步获取指定值
    pub fn get(&mut self, key: &str) -> crate::Result<Option<Bytes>> {
        // 异步调用get获取key对应的值
        todo!();
    }

    /// 异步给key赋值
    pub fn set(&mut self, key: &str, value: Bytes) -> crate::Result<()> {
        // 异步调用set给key赋值
        todo!();
    }    

   /// 异步给key赋值，并指定过期时间
       pub fn set_expires(
        &mut self,
        key: &str,
        value: Bytes,
        expiration: Duration,
    ) -> crate::Result<()> {
        // 异步调用set_expires给key赋值
        todo!();
    }

    /// 异步推送消息
    pub fn publish(&mut self, channel: &str, message: Bytes) -> crate::Result<u64> {
        // 异步调用publish给指定channel推送消息
        todo!();
    }

    /// 异步执行订阅指定频道操作，并将Client转换为BlockingSubcriber状态
    pub fn subscribe(self, channels: Vec<String>) -> crate::Result<BlockingSubscriber> {
        // 异步调用subscribe函数，转换client状态
        todo!();
        // 返回BlockingSubscriber
        todo!();
    }    
}
```

### BlockingSubscriber

#### Struct

```rust
pub struct BlockingSubscriber {
    /// 异步的订阅者
    inner: crate::client::Subscriber,
    /// 运行时环境，负责调度和管理异步任务的执行
    rt: Runtime,
}
```

#### Implementations

```rust
impl BlockingSubscriber{
    /// 获取订阅的channel集合
    pub fn get_subscribed(&self) -> &[String] {
        // 获取订阅的channel集合，并返回
        todo!();
    }

       /// 异步接收下一条信息
       pub fn next_message(&mut self) -> crate::Result<Option<Message>> {
        // 异步执行获取下一条信息的操作
        todo!();
    }

    /// 异步订阅新的频道集合
    pub fn subscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        // 异步订阅新的频道集合
        todo!();
    }

    /// 异步执行取消订阅指定频道集操作
    pub fn unsubscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        // 异步执行取消订阅指定频道集操作
        todo!();
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

### SubscriberIterator

#### Struct

```rust
/// BlockingSubscriber的迭代器
/// 通过`Subscriber::into_iter`可以获取
struct SubscriberIterator {
    /// BlockingSubscriber中的Subscriber
    inner: crate::client::Subscriber,

    /// BlockingSubscriber中的Runtime
    rt: Runtime,
}
```

#### Implementation

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

### Fn Connect

```rust
pub fn connect<T: ToSocketAddrs>(addr: T) -> crate::Result<BlockingClient> {
    // 创建了一个基于当前线程的运行时环境
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    // 创建链接
    let inner = rt.block_on(crate::client::connect(addr))?;

    Ok(BlockingClient { inner, rt })
}
```

## cmd

### Get

> 获取key对应的value

* 如果key不存在，返回nil
* 如果value不是string类型，返回error

#### Struct

```rust
#[derive(Debug)]
pub struct Get {
    /// Name of the key to get
    key: String,
}
```

#### Implementation

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
         todo!();

        // 日志记录响应
        todo!();

        // 将响应写入连接
        todo!();

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

### Publish

#### Struct

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

#### Implementation

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
        todo!();

        // 获取字节形式的message
        todo!();

        // 返回对应Publish
        todo!();
    }

    /// 对数据库执行publish命令
    pub(crate) async fn apply(self, db: &Db, dst: &mut Connection) -> crate::Result<()
        // 向数据库连接执行publish操作，并获取到订阅channel的subscriber的数量
        todo!();

        // 将subscriber_num转换成整数帧，并将其写入连接
        todo!();

        Ok(())
    }
    /// 将publish命令转成frame的形式
    pub(crate) fn into_frame(self) -> Frame {
        let mut frame = Frame::array();
        // 将publish命令以["publish",channel,message]的形式写入数组。注意每个元素都要转成字节形式
        todo!();
        frame
    }
}
```

### Set

#### Struct

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

#### Implementation

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

    /// 对数据库连接执行set命令
    #[instrument(skip(self, db, dst))]
    pub(crate) async fn apply(self, db: &Db, dst: &mut Connection) -> crate::Result<()> {
        // 执行set
        todo!();

        // 创建执行成功响应，并写给连接
        todo!();
        Ok(())
    }

    /// 将set命令转成frame形式
    pub(crate) fn into_frame(self) -> Frame {
        let mut frame = Frame::array();
        // 将命令以["set",key,value]的形式写入frame
        todo!();
        // 判断是否有过期时间，如果有过期时间以["px",ms]的格式写入frame
        todo!();
        frame
    }
}
```

### Subscribe+Message

#### Struct

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
type Messages = Pin<Box<dyn Stream<Item = Bytes> + Send>>
```

#### Implementation

```rust
impl Subscribe{
    /// 新建subscribe命令
    pub(crate) fn new(channels: &[String]) -> Subscribe {
        Subscribe {
            channels: channels.to_vec(),
        }
    }
     /// 解析subscribe帧
     pub(crate) fn parse_frames(parse: &mut Parse) -> crate::Result<Subscribe> {
        use ParseError::EndOfStream;
        // 获取第一个channel，并判断是否为none，不为none则写入数组
        todo!();
        // 循环解析剩下的channel，并将其写入数组
        todo!();
        // 返回结果
        todo!();
    }

    /// 数据库执行subscribe命令
    pub(crate) async fn apply(
        mut self,
        db: &Db,
        dst: &mut Connection,
        shutdown: &mut Shutdown,
    ) -> crate::Result<()> {
        // 使用map可以防止订阅重复
        let mut subscriptions = StreamMap::new();

        loop {
            // `self.channels`会被用于监听已订阅的频道
            // 在这期间订阅的频道也会被加入其中
            for channel_name in self.channels.drain(..) {
                subscribe_to_channel(channel_name, &mut subscriptions, db, dst).await?;
            }

            // Wait for one of the following to happen:
            //
            // - Receive a message from one of the subscribed channels.
            // - Receive a subscribe or unsubscribe command from the client.
            // - A server shutdown signal.
            select! {
                // Receive messages from subscribed channels
                Some((channel_name, msg)) = subscriptions.next() => {
                    dst.write_frame(&make_message_frame(channel_name, msg)).await?;
                }
                res = dst.read_frame() => {
                    let frame = match res? {
                        Some(frame) => frame,
                        // This happens if the remote client has disconnected.
                        None => return Ok(())
                    };

                    handle_command(
                        frame,
                        &mut self.channels,
                        &mut subscriptions,
                        dst,
                    ).await?;
                }
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
        frame
    }

async fn subscribe_to_channel(
    channel_name: String,
    subscriptions: &mut StreamMap<String, Messages>,
    db: &Db,
    dst: &mut Connection,
) -> crate::Result<()> {
    let mut rx = db.subscribe(channel_name.clone());

    // Subscribe to the channel.
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

    // Track subscription in this client's subscription set.
    subscriptions.insert(channel_name.clone(), rx);

    // Respond with the successful subscription
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
        todo!();
        }
        Command::Unsubscribe(mut unsubscribe) => {
            // 判断是否指定了要取消订阅的频道
            // 如果没有则需要订阅所有channels
            todo!();
            // 将需要取消订阅的频道从map中移除
            todo!();
            // 生成unsubscribe响应
            todo!();
            // 写入unsubscribe响应
            todo!();
            }
        }
        command => {
             // 其他命令都看作是unknown命令
             todo!();
        }
    }
    Ok(())
}

}
```

### Unsubscribe

#### Struct

```rust
/// 取消订阅命令
///
/// 如果channels为空，则取消订阅所有频道
#[derive(Clone, Debug)]
pub struct Unsubscribe {
    channels: Vec<String>,
}
```

#### Implementation

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
        todo!();

        // 循环解析数据，将channel放入数组
        todo!();

        // 返回命令
    }
    /// 将unsubscribe命令转成帧
    pub(crate) fn into_frame(self) -> Frame {
        let mut frame = Frame::array();
        // 将命令以["unsubscribe",channel1,channel2...]形
        // 式放入数组
        todo!();
        frame
    }
}
```

### Unknown

#### Struct

```rust
#[derive(Debug)]
pub struct Unknown {
    command_name: String,
}
```

#### Implementation

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
        todo!();
    }

    /// 回应客户端不支持当前命令
    #[instrument(skip(self, dst))]
    pub(crate) async fn apply(self, dst: &mut Connection) -> crate::Result<()> {
        // 生成错误帧响应
        todo!();
        // 日志记录响应
        todo!();
        // 将帧写入连接
        todo!();
        Ok(())
    }
}
```

## frame

> redis协议帧

### enum

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

## sever

> mini-redis的服务端。提供了一个异步的`run`函数，用于监听连接，并为每个连接生成一个任务

### Listener

#### Struct

```rust
/// 服务端用于监听的连接
#[derive(Debug)]
struct Listener {
    /// 可共享的数据库连接句柄（Arc形式）
    db: Db,

    /// 由run函数提供
    listener: TcpListener,

    /// 用于限制连接数
    limit_connections: Arc<Semaphore>,

    /// 用于广播shutdown信号
    notify_shutdown: broadcast::Sender<()>,

    /// 用于在客户端完成所有任务后安全关闭连接。
    /// 当一个连接被初始化，它会保存‵shutdown_complete_tx‵的clone，被关闭时回收
    /// 当所有listener的连接都被关闭后，sender也会被释放
    /// 所有任务被完成后，`shutdown_complete_rx.recv()`会返回`None`
    shutdown_complete_rx: mpsc::Receiver<()>,
    shutdown_complete_tx: mpsc::Sender<()>,
}
```

#### Implementation

```rust
impl Listener {
    /// 启动server监听连接
    async fn run(&mut self) -> crate::Result<()> {
        info!("accepting inbound connections");

        loop {
            // 等待有名额创建连接
            self.limit_connections.acquire().await.unwrap().forget();

            // 建立tcp连接，获取套接字
            let socket = self.accept().await?;

            // 存储连接状态
            let mut handler = Handler {
                // 获取数据库连接
                db: self.db.clone(),

                // 新建连接
                connection: Connection::new(socket),

                // 保存信号量，用于归还信号量
                limit_connections: self.limit_connections.clone(),

                // 用于接受shutdown信号
                shutdown: Shutdown::new(self.notify_shutdown.subscribe()),

                // 一旦所有的clone被释放，会通过此成员来通知
                _shutdown_complete: self.shutdown_complete_tx.clone(),
            };

                // 创建一个异步的任务执行连接要做的操作
                if let Err(err) = handler.run().await {
                    error!(cause = ?err, "connection error");
                }
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

### Handler

#### Struct

```rust
/// 服务端的具体连接
#[derive(Debug)]
struct Handler {
    /// 数据库连接
    db: Db,

    /// tcp连接
    connection: Connection,

    /// 最大连接数
    limit_connections: Arc<Semaphore>,

    /// 监听shutdown信号
    shutdown: Shutdown,

    /// 不直接使用，用来判断当前类对象是否被释放
    _shutdown_complete: mpsc::Sender<()>,
}
```

#### Implementation

```rust
impl Handler {
    /// 处理单个连接
    /// 
    /// 当接收到shutdown信号时，等到该连接处于安全状态时，连接会断开
    #[instrument(skip(self))]
    async fn run(&mut self) -> crate::Result<()> {
        // 循环处理帧
        while !self.shutdown.is_shutdown() {
            let maybe_frame = tokio::select! {
                res = self.connection.read_frame() => res?,
                _ = self.shutdown.recv() => {
                    // 接收到shutdown信号，退出run函数会使任务结束
                    return Ok(());
                }
            };

            // 判断从远端收到的帧（maybe_frame）是否有内容，收到‵None`时说明远端关闭
            todo!();

            // 将frame转为命令形式
            todo!();

            // 日志记录接收到的命令
            todo!();

            // 异步执行命令
            todo!();

        }

        Ok(())
    }
}


impl Drop for Handler {
    fn drop(&mut self) {
        // 归还一个信号量
        todo!();
    }
}
```

### Fn Run

```rust
/// mini-redis的服务端启动函数
pub async fn run(listener: TcpListener, shutdown: impl Future) -> crate::Result<()> {
    // 初始化shutdown信号广播管道
    let (notify_shutdown, _) = broadcast::channel(1);
    // 初始化shutdown关闭机制
    let (shutdown_complete_tx, shutdown_complete_rx) = mpsc::channel(1);

    // 初始化监听连接
    let mut server = Listener {
        listener,
        db: Db::new(),
        limit_connections: Arc::new(Semaphore::new(MAX_CONNECTIONS)),
        notify_shutdown,
        shutdown_complete_tx,
        shutdown_complete_rx,
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
        mut shutdown_complete_rx,
        shutdown_complete_tx,
        notify_shutdown,
        ..
    } = server;

    // 所有的处在subscribe状态的任务会接收到shutdown信号并且退出
    drop(notify_shutdown);
    // 回收监听者的shutdown_complete_tx，意味着只有其他连接持有shutdown_complete_tx了
    drop(shutdown_complete_tx);

    // 等待所有活跃连接完成其任务和释放shutdown_complete_tx。
    // 当所有shutdown_complete_tx都被释放，说明所有连接都断开了
    // 此时`recv()`会返回`None`并且`mpsc`管道会被关闭
    let _ = shutdown_complete_rx.recv().await;

    Ok(())
}
```
