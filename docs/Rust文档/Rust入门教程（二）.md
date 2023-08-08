# Rust 入门教程（二）：结构体和枚举

## 一、结构体的使用

### 1. 定义和实例化 struct

例子：

```rust
struct User {
    username: String,
    email: String,
    sign_in_count: usize,
    active: bool,
}
```

需要注意的是，每个字段后面用逗号隔开，最后一个字段后面可以没有逗号。

实例化例子：

```rust
let user1 = User {
        email: String::from("cherry@gmail.com"),
        username: String::from("cherry"),
        active: true,
        sign_in_count: 244,
    };
```

先创建 struct 实例，然后为每个字段指定值，无需按照声明的顺序指定。

但是注意不能少指定字段。

用点标记法取得结构体中的字段值，一旦 struct 的实例是可变的，那么实例中的所有字段都是可变的，不会同时既存在可变的字段又存在不可变的字段。

**结构体作为函数的返回值**

```rust
fn struct_build() -> User {
    User {
        email: String::from("cherry@gmail.com"),
        username: String::from("cherry"),
        active: true,
        sign_in_count: 244,
    }
}
```

**字段初始化简写**

当字段名与字段值对应变量相同的时候，就可以使用字段初始化简写的方式：

```rust
fn struct_build(email: String, username: String) -> User {
    User {
        email,
        username,
        active: true,
        sign_in_count: 244,
    }
}
```

**struct 更新语法**

当想基于某个 struct 实例创建一个新的实例时（新的实例中某些字段可能和原先相同，某些不同），若不使用 struct 更新语法，则是这样写：

```rust
let user2 = User {
        email: String::from("paul@nba.cn"),
        username: String::from("Chris Paul"),
        active: user1.active,
        sign_in_count: user1.sign_in_count,
    };
```

而使用 struct 更新语法，则是这样写：

```rust
let user3 = User {
        email: String::from("paul@nba.cn"),
        username: String::from("Chris Paul"),
        ..user1
    };
```

用 `..user1` 表示该实例中未赋值的其他字段和实例 `user1` 中的值一致。

**Tuple Struct**

可以定义类似 Tuple 的 Struct，叫做 Tuple Struct。Tuple struct 整体有个名，但里面的元素没有名

适用：想给整个 tuple 起名，并让它不同于其它 tuple，而且又不需要给每个元素起名

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);
let black(0, 0, 0);
let origin = Point(0, 0, 0);
```

black 和 origin 是不同的类型，是不同 tuple struct 的实例

**Unit-Like Struct(没有任何字段)**

可以定义没有任何字段的 struct，叫做 `Unit-Like struct`，因为与 `()` 和单元类型类似，适用于需要在某个类型上实现某个trait，但是在里面又没有想要存储的数据

**struct 数据所有权**

再来看这个例子：

```rust
struct User {
    username: String,
    email: String,
    sign_in_count: usize,
    active: bool,
}
```

这里的字段使用了 `String` 而不是 `&str`，原因如下：
- 该 struct 实例拥有其所有的数据
- 只要 struct 实例是有效的，那么里面的字段数据也是有效的 struct 里也可以存放引用，但这需要使用生命周期（以后讲）
- 若字段为 `&str`，当其有效作用域小于该实例的作用域，该字段被清理时，实例未清理，访问该字段属于悬垂引用（类似野指针）
- 生命周期保证只要 struct 实例是有效的，那么里面的引用也是有效的
- 如果 struct 里面存储引用，而不使用生命周期，就会报错

### 2. struct 例子

一个简单的例子：计算长方形的面积

```rust
fn main() {
    let width = 25;
    let length = 12;
    let area = area_of_rectangle(width, length);
    println!("The Area of Rectangle is {}.", area);
}

fn area_of_rectangle(width: usize, length: usize) -> usize {
    width * length
}
```

上面这个例子很简单，但是长方形的长和宽没有联系起来，width 和 length 是两个分离的没有逻辑联系的变量，我们考虑用元组将其联系起来：

```rust
fn main() {
    let rect = (25, 12);
    println!("The Area of Rectangle is {}.", area_of_rectangle(rect));
}

fn area_of_rectangle(rect: (u32, u32)) -> u32 {
    rect.0 * rect.1
}
```

但是这样仿佛可读性变差了，我们再用结构体实现：

```rust
struct Rectangle {
    width: u32,
    length: u32,
}

fn main() {
    let rect = Rectangle {
        width: 35,
        length: 12,
    };
    println!("The Area of Rectangle is {}.", area_of_rectangle(&rect));
}

fn area_of_rectangle(rect: &Rectangle) -> u32 {
    rect.length * rect.width
}
```

函数的参数使用结构体的借用，是为了不获得该实例的所有权，主函数在函数调用之后还可以继续使用该实例。

此时我们输出实例 `rect`，会报这样的错误：`Rectangle doesn't implement std::fmt::Display`，即该结构体未实现 `Display` 这个 trait，而 Rust 中很多类型都是实现了这个 trait，才能将其在终端打印出来。因为结构体这种比标量类型更加复杂，打印的类型的可能性很多，因此需要用户自定义实现 `Display`。

在报错的提示信息里，有个 note 提示我们可以使用 `{:?}` (或 `{:#?}`)来打印信息:

```rust
println!("{:?}", rect);
```

然而又出现了错误，这次的报错信息是：`Rectangle doesn't implement Debug`，显然 `Debug` 也是一种格式化方法，再看提示的 note：`add #[derive(Debug)] to Rectangle or manually impl Debug for Rectangle`，我们在结构体前添加 `#[derive(Debug)]`，使得该结构体派生与 `Debug` 这个 trait。

最终完整的程序如下：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    length: u32,
}

fn main() {
    let rect = Rectangle {
        width: 35,
        length: 12,
    };

    println!("The Area of Rectangle is {}.", area_of_rectangle(&rect));
    println!("{:?}", rect);
}

fn area_of_rectangle(rect: &Rectangle) -> u32 {
    rect.length * rect.width
}
```

输出结果为：

```rust
➜  ~/Code/rust/area_of_rectangle git:(master) ✗ cargo run
   Compiling area_of_rectangle v0.1.0 (/home/cherry/Code/rust/area_of_rectangle)
    Finished dev [unoptimized + debuginfo] target(s) in 0.25s
     Running `target/debug/area_of_rectangle`
The Area of Rectangle is 420.
Rectangle { width: 35, length: 12 }
```

若在输出格式中间加入一个 `#`，结构体输出将更加清晰：`println!("{:?}", rect);`，输出结果为：

```rust
Rectangle {
    width: 35,
    length: 12,
}
```

### 3. struct 方法

方法和函数类似: fn关键字、名称、参数、返回值

方法与函数不同之处:
- 方法是在 struct(或 enum、trait 对象）的上下文中定义
- 第一个参数是 self，表示方法被调用的 struct 实例

上一节我们定义了计算长方形面积的函数，但是该函数只能计算长方形的函数，无法计算其他形状的面积，因此我们希望将函数与长方形这一结构体关联起来，例子如下：

```rust
struct Rectangle {
    width: u32,
    length: u32,
}

impl Rectangle {
    fn area_of_rectangle(&self) -> u32 {
        self.length * self.width
    }
}

fn main() {
    let rect = Rectangle {
        width: 35,
        length: 12,
    };

    println!("The Area of Rectangle is {}.", rect.area_of_rectangle());
}
```

在impl块里定义方法，方法的第一个参数可以是 `&self`，也可以**获得其所有权**或**可变借用**，和其他参数一样。这样写可以有更良好的代码组织。

**方法调用的运算符**

- C/C++ 中 `object->something()` 和 `(*object).something()` 一样，但是 Rust 没有 `→` 运算符
- Rust 会自动引用或解引用一在调用方法时就会发生这种行为
- 在调用方法时，Rust 根据情况自动添加 `&`、`&mut` 或 `*`，以便 object 可以匹配方法的签名
- 下面这两种写法效果相同
  - `p1.distance(&p2);`
  - `(&p1).distance(&p2);`

**方法参数**

```rust
impl Rectangle {
    fn area_of_rectangle(&self) -> u32 {
        self.length * self.width
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.length > other.length && self.width > other.width 
    }
}
```

**关联函数**

可以在 impl 块里定义不把 self 作为第一个参数的函数，它们叫关联函数（不叫方法）

例如：`String::from()`

关联函数通常用于构造器，例子如下：

```rust
struct Rectangle {
    width: u32,
    length: u32,
}


impl Rectangle {
    fn square(size: u32) -> Rectangle {
        Rectangle {
            width: size,
            length: size,
        }
    }
}

fn main() {
    let s = Rectangle::square(20);
}
```

`::` 符号
- 关联函数
- 模块创建的命名空间

## 二、枚举与模式匹配

### 1. 枚举的定义

枚举允许我们列举所有可能的类型来定义一个类型

例如 IP 地址，目前只有 IPv4 和 IPv6 两种类型，我们可以定义这样的枚举类型并使用：

```rust
enum IpAddrKind {
    V4,
    V6,
}

fn main() {
    let four = IpAddrKind::V4;
    let six = IpAddrKind::V6;
    route(four);
    route(six);
    route(IpAddrKind::V6);
}

fn route(ip_kind: IpAddrKind) {}
```

枚举的变体都位于标识符的命名空间下，使用两个冒号 `::` 进行分隔

枚举类型是一种自定义的类型，因此它可以作为结构体里字段的类型，例子如下：

```rust
enum IpAddrKind {
    V4,
    V6,
}

struct IpAddr {
    kind: IpAddrKind,
    address: String,
}

fn main() {
    let home = IpAddr {
        kind: IpAddrKind::V4,
        address: String::from("192.168.3.1"),
    };
}
```

**将数据附加到枚举的变体中**

上述的枚举类型我们可以改为：

```rust
enum IpAddr {
    V4(String),
    V6(String),
}
```

优点是：不需要使用 struct，**每个变体可以拥有不同的类型以及相关联的数据量**，例如

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

fn main() {
    let home = IpAddrKind::V4(192, 168, 1, 1);
    let loopback = IpAddrKind::V6(String::from("::1"));
}
```

**标准库中的 IpAddr**

```rust
struct lpv4Addr {
    // --snip--
}
struct lpv6Addr {
    // --snip--
}
enum lpAddr {
    V4(lpv4Addr),
    V6(lpv6Addr),
}
```

**为枚举定义方法**

也使用 `impl` 这个关键字

```rust
enum Message {
    Quit,
    Move {x: u32, y: u32},
    Write(String),
    ChangeColor(i32, i32, i32),
}

impl Message {
    fn call(&self) {}
}

fn main() {
    let q = Message::Quit;
    let m = Message::Move{x: 10, y: 12};
    let w = Message::Write(String::from("Hello"));
    let c = Message::ChangeColor(0, 255, 255);
}
```

### 2. Option 枚举

- 定义于标准库中
- 在 Prelude（预导入模块）中
- 描述了某个值可能存在（某种类型）或不存在的情况

**Rust 中没有 NULL**

其它语言中:
- Null是一个值，它表示“没有值”
- 一个变量可以处于两种状态：空值（null）、非空 
- Null 引用：Billion Dollar Mistake

Null 的问题在于:当你尝试像使用非Null值那样使用Null值的时候，就会引起某种错误，但是 Null 的概念还是有用的：**因某种原因而变为无效或缺失的值**

Rust 中类似与 NULL 的概念的枚举：`Option<T>`

标准库中的定义：

```rust
enum Option<T> {
    Some(T),
    None,
}
```

它包含在预导入模块（Prelude）中，可以直接使用 `Option<T>`, `Some(T)`, `None`。例子如下：

```rust
fn main() {
    let some_num = Some(3);
    let some_string = Some("The String");
    let absent_num: Option<i32> = None;
}
```

其中 `Some(3)` 编译器可以推断出来 `T` 类型为 `usize`，而 `None` 的话编译器无法推断出来，因此需要显式指定 `Option<i32>`

这种设计比 NULL 好在哪？

因为 `Option<T>` 和 `T` 是不同的类型，不能将 `Option<T>` 当成 `T` 使用，例子如下：

```rust
fn test02() {
    let x: i8 = 5;
    let y: Option<i8> = Some(5);
    let sum = x + y;
}
```

这样会报错，提示 `cannot add Option<i8> to i8`，表示两者不是同一个类型，若想使用 `Option<T>` 中的 `T`，则必须将其手动转换为 `T`，这种设计方式可以避免代码中 NULL 值泛滥的情况。

### 3. match

**强大的控制流运算符 match**

允许一个值与一系列模式进行匹配，并执行匹配的模式对应的代码。模式可以是字面值、变量名、通配符...

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => {
            println!("Penny!");
            1
        },
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

**绑定值的模式**

匹配的分支可以绑定到被匹配对象的部分值，因此可以从 enum 变体中提取值，例子如下：

```rust
#[derive(Debug)]
enum USState {
    California,
    Texas,
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(USState),
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,  
        Coin::Quarter(state) => {
            println!("State quarter from {:?}", state);
            25
        },

        /* Coin::Quarter(state) 也可以这样展开写 */
        Coin::Quarter(USState::Texas) => {
            println!("State quarter from {:?}", USState::Texas);
            25
        },
        Coin::Quarter(USState::California) => {
            println!("State quarter from {:?}", USState::California);
            25
        }
    }
}

fn test03() {
    let c = Coin::Quarter(USState::California);
    println!("{}", value_in_cents(c));
}
```

**匹配 Option<T>**

```rust
fn test04() {
    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);
}

fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1)
    }
}
```

注意：match 匹配必须穷举所有的可能，可以使用 `_` 通配符替代其他没有列出的值

```rust
fn test05() {
    let x = 0u8;
    match x {
        1 => println!("one"),
        3 => println!("three"),
        5 => println!("five"),
        _ => ()
    }
}
```

### 4. if let

`if let` 是一种比 `match` 简单的控制流，他处理只关心一种匹配而忽略其他匹配的情况，它有更少的代码，更少的缩进，更少的模板代码，但是放弃了穷举的可能，可以把 `if let` 看作是 `match` 的语法糖。

`if let` 的格式如下：

```rust
if let pattern = value {
    //TODO
}
```

他也可以搭配 `else` 例子如下：

```rust
fn test06() {
    let v = 8u8;

    match v {
        3 => println!("Three!"),
        _ => ()
    }

    if let 3 = v {
        println!("Three")
    } else if let 5 = v {
        println!("Five!")
    } else {
        println!("Others!")
    }
}
```
