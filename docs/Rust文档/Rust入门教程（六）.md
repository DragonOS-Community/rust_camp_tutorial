# Rust入门教程（六）：泛型和特性

>泛型是一个编程语言不可或缺的机制。
>C++ 语言中用"模板"来实现泛型，而 C 语言中没有泛型的机制，这也导致 C 语言难以构建类型复杂的工程。
>泛型机制是编程语言用于表达类型抽象的机制，一般用于功能确定、数据类型待定的类，如链表、映射表等。

## 1. 泛型

### 1.1 泛型介绍

- 泛型可以提高代码复用能力，也就是处理重复代码的问题
- 泛型是具体类型或其它属性的抽象代替:
  - 你编写的代码不是最终的代码，而是一种模板，里面有一些“占位符”
  - 编译器在编译时将**占位符**替换为具体的类型
  - 例如：`fn largest<T>(list: &[T]) ->T {...}`
- 类型参数
  - 很短，通常一个字母
  - CamelCase
  - T: type 的缩写

### 1.2 在函数定义中使用泛型

泛型函数
- 参数类型
- 返回类型

```rust
fn main() {
    let a = vec![10, 80, 2022, 36, 47];
    let largest = largest(&a);
    println!("The largest ele is {}", largest);
}

fn largest(list: &[i32]) -> i32 {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

上面这段代码是求一个集合中最大的元素，我们定义的集合是一个 `i32` 类型，但是这时如果我们要传入 `f32` 或者字符型，还用同样的逻辑判断函数的话，是会报错的，这时我们就需要用到泛型。

```rust
fn largest<T>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

我们声明了一个泛型 `T`，但是这样是会编译报错的，因为不是所有类型 T 都可以进行大小比较，只有实现了下面的 `std::cmp::PartialOrd` 的 trait 才能进行大小比较，所以要对 T 进行约束。

```rust
➜  ~/Code/rust/pattern git:(master) ✗ cargo run
   Compiling pattern v0.1.0 (/home/cherry/Code/rust/pattern)
error[E0369]: binary operation `>` cannot be applied to type `T`
  --> src/main.rs:10:17
   |
10 |         if item > largest {
   |            ---- ^ ------- T
   |            |
   |            T
   |
help: consider restricting type parameter `T`
   |
7  | fn largest<T: std::cmp::PartialOrd>(list: &[T]) -> T {
   |             ++++++++++++++++++++++

For more information about this error, try `rustc --explain E0369`.
error: could not compile `pattern` due to previous error
```

但是把 `std::cmp::PartialOrd` 这个 trait 加上又会报其他错误，这里在后面会进行介绍。

### 1.3 结构体中的泛型

可以使用多个泛型的类型参数，但是也不要有太多的类型，否则代码可读性将会下降。例如：

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

fn test01() {
    let integer = Point{x: 2022, y: 6.1};   
}
```

### 1.4 Enum定义中的泛型

可以让枚举的变体持有泛型数据类型，例如：Option<T>, Result<T, E>

```rust
enum Option<T> {
    Some(T),
    None
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

### 1.5 方法定义中使用泛型

```rust
fn test01() {
    let integer = Point{x: 2022, y: 61};
    println!("{}", integer.x());
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}
```

注意
- 把 T 放在 impl 关键字后，表示在类型 T 上实现方法
  - 例如：`impl<T> Point<T>`
- 只针对具体类型实现方法（其余类型没实现方法）
  - 例如: `impl Point<f32>`
- struct 中的泛型参数可以和方法的泛型参数不同

```rust
impl<T, U> Point<T, U> {
    fn x(&self) -> &T {
        &self.x
    }
}

impl<T, U> Point<T, U> {
    fn mixup<V, W>(self, other: Point<V,W>) -> Point<T, W> {
        Point {
            x: self.x,
            y: other.y  
        }
    }
}

fn test02() {
    let p1 = Point{x: 61, y: 85};
    let p2 = Point{x: "Hello", y: "Rust"};
    let p3 = p1.mixup(p2);
    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

上面实现的结构体方法实际上是将第一个 Point 中的 x 和第二个 Point 的 y 结合起来形成一个新的 Point。

### 1.6 泛型代码的性能

使用泛型的代码和使用具体类型的代码运行速度是一样的
- 单态化（monomorphization）
  - 在编译时将泛型替换为具体类型的过程

```rust
let ingeter = Some(5);
let float = Some(5.0);

enum Option_i32 {
    Some(i32),
    None
}

enum Option_f32 {
    Some(f32),
    None
}

fn main() {
    let integer = Option_i32::Some(5);
    let float = Option_f64::Some(5.0);
}
```

## 2. trait

- Trait 告诉 Rust 编译器
  - 某种类型具有哪些并且可以与其它类型共享的功能
- Trait：抽象的定义共享行为
- Trait bounds（约束）：泛型类型参数指定为实现了特定行为的类型
- Trait与其它语言的接口（interface）类似，但有些区别

### 2.1 定义一个 Trait

Trait的定义：把方法签名放在一起，来定义实现某种目的所必需的一组行为。
- 关键字：trait
- 只有方法签名，没有具体实现
- trait 可以有多个方法：每个方法签名占一行，以 `;` 结尾
- 实现该 trait 的类型必须提供具体的方法实现

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

### 2.2 在类型上实现 trait

- 在类型上实现 trait。与为类型实现方法类似
- 不同之处：`impl Xxxx for Tweet {...}`
- 在 impl 的块里，需要对 Trait 里的方法签名进行具体的实现

文件 `lib.rs`：

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}
```

文件 `main.rs`：

```rust
use trait_demo::Summary;
use trait_demo::Tweet;

fn main() {
    let tweet = Tweet {
        username: String::from("Cherry_ICT"),
        content: String::from("People in Shanghai are free today..."),
        reply: false,
        retweet: false
    };

    println!("Get 1 new tweet: {}", tweet.summarize());

}
```

实现的功能很简单，不做具体解释了。


### 2.3 实现 trait 的约束

- 可以在某个类型上实现某个 trait 的前提条件是
  - 这个类型或这个 trait 是在本地 crate 里定义的
- 无法为外部类型来实现外部的trait
  - 这个限制是程序属性的一部分（也就是一致性）
  - 更具体地说是**孤儿规则**：之所以这样命名是因为父类型不存在
  - 此规则确保其他人的代码不能破坏您的代码，反之亦然
  - 如果没有这个规则，两个 crate 可以为同一类型实现同一个 trait，Rust 就不知道应该使用哪个实现了

**默认实现**

默认实现的方法可以调用 trait 中的其他方法，即使这些方法没有默认实现，但是注意，无法从方法的重写实现中调用默认实现。

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        format!("(Read more from {} ...)", self.summarize_author())
    }

    fn summarize_author(&self) -> String;
}
```

在 trait 中可以有方法的默认实现，在默认实现的基础上，类型可以对该 trait 进行重载。同样，在 trait 中默认实现的方法可以实现 trait 中其他方法。

### 附

刚刚 trait 例子的完整代码如下：

`lib.rs`：

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        format!("(Read more from {} ...)", self.summarize_author())
    }

    fn summarize_author(&self) -> String;
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }

    fn summarize_author(&self) -> String {
        format!("@{}", self.author)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }

    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
}
```

`main.rs`：

```rust
use trait_demo::Summary;
use trait_demo::Tweet;
use trait_demo::NewsArticle;

fn main() {
    let tweet = Tweet {
        username: String::from("Cherry_ICT"),
        content: String::from("People in Shanghai are free today..."),
        reply: false,
        retweet: false
    };

    println!("Get 1 new tweet: {}", tweet.summarize());

    let news = NewsArticle {
        headline: String::from("WWDC will be held in June 7th"),
        location: String::from("USA"),
        author: String::from("Tim Cook"),
        content: String::from("The Apple will take us a lot of devices."),
    };

    println!("You receive a news: {}", news.summarize());
}
```

最终输出结果为：

```rust
➜  ~/Code/rust/trait_demo git:(master) ✗ cargo run
   Compiling trait_demo v0.1.0 (/home/cherry/Code/rust/trait_demo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.33s
     Running `target/debug/trait_demo`
Get 1 new tweet: Cherry_ICT: People in Shanghai are free today...
You receive a news: WWDC will be held in June 7th, by Tim Cook (USA)
```

### 2.4 实现 Trait 作为参数

- impl Trait 语法：适用于简单情况
- Trait bound 语法：可用于复杂情况
  - impl trait 语法实际上是 trait bound 语法的语法糖
- 使用 `+` 指定多个 trait bound
- Trait bound 使用 where 子句
  - 在方法签名后指定 where 子句

```rust
pub trait Summary {}

pub struct NewsArticle {}

impl Summary for NewsArticle {}

pub struct Tweet {}

impl Summary for Tweet {}

pub fn notify(item: impl Summary) {
    println!("Breaking news! {}", item.summarize());
}
```

这是采用 impl Trait 的语法，这里的 notify 方法要求传入的参数可以是 `NewsArticle` 类型或者是 `Tweet` 类型，也就是要求参数要实现 `Summary` 这个 trait，从而使用 summarize 这个方法。

```rust
pub fn notify<T: Summary>(item: T) {
    println!("Breaking news! {}", item.summarize());
}
```

这是采用 Trait bound 的写法，下面这个例子讲展示出这种写法的优势：

```rust
pub fn notify<T: Summary>(item1: T, item2: T) {
    println!("Breaking news! {}", item.summarize());
}
```

当有多个参数时，采用这种写法可以使得代码相对简洁一些。

使用 `+` 指定多个 trait bound：

```rust
pub fn notify1(item: impl Summary + Display) {
    println!("Breaking news! {}", item.summarize());
}

pub fn notify<T: Summary + Display>(item: T) {
    println!("Breaking news! {}", item.summarize());
}
```

然而如果一个函数中参数过多，那么整个函数声明就会变得非常长，不太直观，可读性差，这里可以使用 where 子句来指定 trait 的约束：

```rust
pub fn notify2<T: Summary + Display, U: Clone + Debug>(a: T, b: U) -> String {
    format!("Breaking news! {}", a.summarize())
}
```

这个例子中函数签名太长，不够直观，采用 where 子句可以使得更加直观：

```rust
pub fn notify3<T, U>(a: T, b: U) -> String
where
    T: Summary + Display,
    U: Clone + Debug,
{
    format!("Breaking news! {}", a.summarize())
}
```

### 2.5 实现 Trait 作为返回类型

- impl trait 语法
  - 注意：impl Trait 只能返回确定的同一种类型，返回可能不同类型的代码会报错

```rust
pub fn notify4(flag: bool) -> impl Summary {
    if flag {
        NewsArticle {...}
    } else {
        Tweet {...}
    } 
}
```

这样的话这个函数便没有了确定的返回类型，这样便会报错。

### 2.6 使用 trait bound 实现之前泛型 的例子

我们再来看一下[之前的代码](#12-在函数定义中使用泛型)。解决如下：

```rust
fn largest<T: PartialOrd>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

之前我们说过，实际上比较大小的运算符是实现了 `std::cmp::PartialOrd` 这样一个 trait，因此我们需要指定实现这个 trait 的泛型才能进行大小比较。

但是这样改完后又会出现一个问题：

```rust
➜  ~/Code/rust/pattern git:(master) ✗ cargo run 
   Compiling pattern v0.1.0 (/home/cherry/Code/rust/pattern)
error[E0508]: cannot move out of type `[T]`, a non-copy slice
  --> src/main.rs:10:19
   |
10 | let mut largest = list[0];
   |                   ^^^^^^^
   |                   |
   |                   cannot move out of here
   |                   move occurs because `list[_]` has type `T`, which does not implement the `Copy` trait
   |                   help: consider borrowing here: `&list[0]`

error[E0507]: cannot move out of a shared reference
  --> src/main.rs:11:18
   |
11 |     for &item in list {
   |         -----    ^^^^
   |         ||
   |         |data moved here
   |         |move occurs because `item` has type `T`, which does not implement the `Copy` trait
   |         help: consider removing the `&`: `item`

Some errors have detailed explanations: E0507, E0508.
For more information about an error, try `rustc --explain E0507`.
error: could not compile `pattern` due to 2 previous errors
```

报错原因是：无法从 list 中移除 T，因为没有实现 Copy trait，建议采用借用

因为上面两个 vector 中的元素分别为整型和字符型，这两种类型有确定的大小并且都是存储在栈中，因此都实现了 Copy trait，于是在 T 的 trait 约束中再加上 Copy 即可：

```rust
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

但是如果将 vec 中元素类型改为 String，那么又会报错，因为 String 是存储在堆中，没有实现 Copy trait，但是实现了 Clone trait

```rust
let str_list = vec![String::from("Hello"), String::from("World")];
let largest = get_max_ele(&str_list);
```

我们将 T 加上 Clone 约束，去掉 Copy 约束：

```rust
fn get_max_ele<T: PartialOrd + Clone>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

这样又会出现错误：

```rust
error[E0508]: cannot move out of type `[T]`, a non-copy slice
  --> src/main.rs:21:23
   |
21 |     let mut largest = list[0];
   |                       ^^^^^^^
   |                       |
   |                       cannot move out of here
   |                       move occurs because `list[_]` has type `T`, which does not implement the `Copy` trait
   |                       help: consider borrowing here: `&list[0]`
```

是因为这里 list[0] 是字符串切片，是一个借用，没有所有权，因此一个借用给一个变量赋值，这个借用对应的类型必须要实现 Copy trait。因此在 list 前面加上引用，并且将 item 也设为引用，最后返回 &T。

```rust
fn get_max_ele<T: PartialOrd + Clone>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

若要最后还是返回 T，则可以使用 clone 方法：

```rust
fn get_max_ele<T: PartialOrd + Clone>(list: &[T]) -> T {
    let mut largest = list[0].clone();
    for item in list {
        if item > &largest {
            largest = item.clone();
        }
    }
    largest
}
```

### 2.7 使用 Trait Bound 有条件的实现方法

在使用泛型类型参数的 impl 块上使用 Trait bound，我们可以有条件的为实现了特定 Trait 的类型来实现方法

```rust
struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmd_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}
```

- 也可以为实现了其它 Trait 的任意类型有条件的实现某个 Trait
- 为满足 Trait Bound 的所有类型上实现 Trait 叫做覆盖实现 （blanket implementations）

```rust
impl<T: fmt::Display> Tostring for T {}
```

含义为：为实现了 Display trait 的类型实现 ToString trait，而 ToString 中实现了 to_string 方法。

例如 `let s = 3.to_string();`