# Rust入门教程（五）：错误处理

## 一、panic!

### 1.1 Rust 错误处理概述

- Rust 的可靠性：错误处理
  - 大部分情况下：在编译时提示错误，并处理
- 错误的分类
  - 可恢复
    - 例如文件未找到，可再次尝试
  - 不可恢复
    - bug，例如访问的索引超出范围
- Rust 没有类似异常的机制
  - 可恢复错误：`Result<T, E>`
  - 不可恢复：panic! 宏

### 1.2 不可恢复的错误与 panic!

- 当 panic! 宏执行
  - 你的程序会打印一个错误信息
  - 展开（unwind）、清理调用栈（Stack）
  - 退出程序

**为应对 panic，展开或中止（abort）调用栈**

- 默认情况下，当 panic 发生
  - 程序展开调用栈（工作量大）
    - Rust 沿着调用栈往回走
    - 清理每个遇到的函数中的数据
  - 或立即中止调用栈
    - 不进行清理，直接停止程序
    - 内存需要 OS 进行清理
- 想让二进制文件更小，把设置从“展开”改为“中止”
  - 在 Cargo.toml 中适当的 profile 部分设置:
  - `panic = 'abort'`

**使用 panic! 产生的回溯信息**

- panic!可能出现在
  - 我们写的代码中
  - 我们所依赖的代码中
- 可通过调用 panic! 的函数的回溯信息来定位引起问题的代码
- 通过设置环境变量 `RUST_BACKTRACE` 可得到回溯信息
  - Windows 下：`set RUST_BACKTRACE=1 && cargo run`
  - Unix 系下：`RUST_BACKTRACE=1 cargo run`
- 为了获取带有调试信息的回溯，必须启用调试符号（不带 `--release`）

## 二、Result 和可恢复的错误

### 2.1 Result 枚举

Result 枚举类型的定义：

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

T：操作成功情况下 Ok 变体里返回的数据的类型
E：操作失败情况下 Err 变体里返回的错误的类型

处理 Result 的一种方式：match 表达式。和 Option 枚举一样，Result 及其变体也是由 prelude 带入作用域，例子如下：

```rust
fn test02() {
    let file = File::open("foo.txt");
    let f = match file {
        Ok(file) => file,
        Err(error) => {
            panic!("Open File Error: {:?}", error);
        }
    };
}
```

我们鼠标悬停在 file 变量上，可以看到它的类型是：`std::result::Result<std::fs::File, std::io::Error>`，说明 open 函数返回的是一个 Result 枚举，且其第一个参数就是该文件，第二个参数是 io 下的 Error 类型，包含了错误的具体信息。

最终输出结果如下：

```rust
➜  ~/Code/rust/panic git:(master) ✗ cargo run
   Compiling panic v0.1.0 (/home/cherry/Code/rust/panic)
warning: unused variable: `f`
  --> src/main.rs:17:9
   |
17 |     let f = match file {
   |         ^ help: if this is intentional, prefix it with an underscore: `_f`

warning: `panic` (bin "panic") generated 2 warnings
    Finished dev [unoptimized + debuginfo] target(s) in 0.46s
     Running `target/debug/panic`
thread 'main' panicked at 'Open File Error: Os { code: 2, kind: NotFound, message: "No such file or directory" }', src/main.rs:20:13
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

**匹配不同的错误**

```rust
fn test03() {
    let f = match File::open("foo") {
        Ok(file) => file,
        Err(error) => match error.kind(){
            ErrorKind::NotFound => match File::create("foo") {
                Ok(file) => file,
                Err(error) => panic!("Creating File Error: {:?}", error)
            }
            other_error => panic!("Open File Error: {:?}", other_error)
        }
    };
}
```

在 Err 中也会有很多种类型的错误，我们尝试匹配不同的错误类型，例如 `NotFound`。

这里使用了很多 match，尽管很有用，但是比较原始。我们可以使用 **闭包（closure）** ，Result<T, E> 有很多方法，他们使用闭包作为参数，使用 match 进行实现，使用这些方法会使得代码更简洁

```rust
fn test04() {
    let f = File::open("foo.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("foo").unwrap_or_else(|error| {
                panic!("Creating File Error: {:?}", error);
            })
        } else {
            panic!("Open File Error: {:?}", error);
        }
    });
}
```

具体内容到后面再讲。

### 2.2 unwrap 与 expect

**unwrap**

unwrap 是 match 表达式的一个快捷方法，如果 Result 结果是 Ok 则返回 Ok 里面的值，如果 Result 结果是 Err 则调用 panic!宏。以刚刚这段代码举例：

```rust
fn test02() {
    let file = File::open("foo.txt");
    let f = match file {
        Ok(file) => file,
        Err(error) => {
            panic!("Open File Error: {:?}", error);
        }
    };
}
```

unwrap 的作用类似于上面这段代码，当成功打开文件时，unwrap 就会返回 Ok 里面的值，否则就会调用 Err 代码块的代码，上面那段代码用 unwrap 就可以这样写：`let f = File::open("foo.txt").unwrap();`

但是发生恐慌的信息不可以自定义，这也是 unwrap 的一个缺点，而 Rust 提供了另一个方法：expect。

**expect**

和 unwrap 类似，但是可以指定错误信息：`let f = File::open("foo").expect("Open File Error!!!");`，这样得到的报错信息如下：

```rust
➜  ~/Code/rust/panic git:(master) ✗ cargo run
   Compiling panic v0.1.0 (/home/cherry/Code/rust/panic)
warning: unused variable: `f`
  --> src/main.rs:26:9
   |
26 |     let f = File::open("foo").expect("Open File Error!!!");
   |         ^ help: if this is intentional, prefix it with an underscore: `_f`

warning: `panic` (bin "panic") generated 1 warnings
    Finished dev [unoptimized + debuginfo] target(s) in 0.22s
     Running `target/debug/panic`
thread 'main' panicked at 'Open File Error!!!: Os { code: 2, kind: NotFound, message: "No such file or directory" }', src/main.rs:26:31
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

### 2.3 传播错误

当写的函数中包含可能会执行失败的调用的时候，除了可以在函数中处理这个错误，还可以将错误返回给函数的调用者，让他们来决定如何进一步处理这个错误，这就叫做 **传播错误**

```rust
fn read_text_from_file() -> Result<String, Error> {
    let f = File::open("foo");

    let mut f = match f {
        Ok(file) => file,
        Err(error) => return Err(error)
    };

    let mut s = String::new();
    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(error) => Err(error)
    }
}

fn main() {
    let result = read_text_from_file();
    println("{:?}", result);
}
```

将 Result<T, E> 设置成函数返回值，这样就将错误传递给了调用者，若文件 foo 存在的话，最终便可以输出文件中的内容。

Rust 中还提供了 `?` 运算符，用其来简化传播错误的操作。

如果 Result 是 Ok：Ok 中的值就是表达式的结果，然后继续执行程序；
如果 Result 是 Err：Err 就是 **整个函数** 的返回值，就像使用了 return。例子如下：


```rust
fn read_text_from_file_easy() -> Result<String, Error> {
    let mut f = File::open("foo")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

上面这段简化后的代码的含义就是，若 `?` 前 Result 类型的值是 Ok，那么 Ok 里的值就会作为表达式的返回值进行返回，若类型是 Err，那么 Err 就当做整个函数的返回值进行返回。而 `f.read_to_string(&mut s)?;` 中，若 Result 类型是 Ok，实际上里面值为空，没有用到，因此当表达式返回 Ok 后，返回一个 Ok(s) 作为函数的返回值，若类型为 Err，则将其作为函数返回值进行返回。

上面这个例子还可以继续进行优化，使用链式调用：

```rust
fn read_text_from_file_easist() -> Result<String, Error> {
    let mut s = String::new();
    File::open("foo")?.read_to_string(&mut s)?;
    Ok(s)
}
```

**值得注意的是，要使用 ? 运算符，必须保证函数返回类型为 Result<T, E>**，倘若我们尝试一下函数返回类型不是 Result，将会得到这样一条报错信息：`error[E0277]: the '?' operator can only be used in a function that returns 'Result' or 'Option' (or another type that implements 'FromResidual')`

因此，? 运算符只能用于返回类型为 Result 或 Option 的函数

**? 运算符与 main 函数**

- main 函数返回类型是:()
- main 函数的返回类型也可以是：Result<T，E>

```rust
use std::error::Error as error;

fn main() -> Result<(), Box<dyn error>> {
    let f = File::open("foo")?;
    Ok(())
}
```

`Box<dyn Error>` 是 trait 对象，可以简单理解为“任何可能的错误类型”。

这样就可以在 main 函数中使用 `?` 运算符了。

（开始玄学 o_o）

**? 与 from 函数**

- `Trait std:convert::From` 上的 from 函数
  - 用于错误之间的转换
- 被 ? 所应用的错误，会隐式的被 from 函数处理
- 当 ? 调用 from 函数时
  - 它所接收的错误类型会被转化为当前函数返回类型所定义的错误类型
- 用于：针对不同错误原因，返回同一种错误类型
  - 只要每个错误类型实现了转换为所返回的错误类型的 from 函数

### 2.4 什么时候应该使用 panic!

**总体原则**

在定义一个可能失败的函数时，优先考虑返回 Result，若你觉得这个错误一定无法恢复，那就可以代替调用者调用 panic!

**编写示例、原型代码、测试**

可以使用panic!
- 演示某些概念: unwrap
- 原型代码: unwrap、expect
- 测试: unwrap、expect
  - 测试的失败是用 panic! 进行标记的

**有时你比编译器掌握更多的信息**

你可以确定 Result 就是 Ok，那么可以使用 unwrap，例子如下：

```rust
use std::net::IpAddr;
fn test06() {
    let home: IpAddr = "192.168.3.110".parse().unwrap();
}
```

这里我们可以确定这个 IP 地址解析出来一定是有效的，因此可以直接使用 unwrap。

**错误处理的指导性建议**
- 当代码最终可能处于损坏状态时，最好使用 panic!
- 损坏状态（Bad state）：某些假设、保证、约定或不可变性被打破
  - 例如非法的值、矛盾的值或空缺的值被传入代码
  - 以及下列中的一条：
    - 这种损坏状态并不是预期能够偶尔发生的事情
    - 在此之后，您的代码如果处于这种损坏状态就无法运行
    - 在您使用的类型中没有一个好的方法来将这些信息（处于损坏状态）进行编码

**场景建议**
- 调用你的代码，传入无意义的参数值：panic!
- 调用外部不可控代码，返回非法状态，你无法修复：panic!
- 如果失败是可预期的：Result
- 当你的代码对值进行操作，首先应该验证这些值：panic!

**为验证创建自定义类型**

创建新的类型，把验证逻辑放在构造实例的函数里。

以第一节的猜数游戏为例：

```rust
fn main() {
    loop {
        //...
        let guess = "32";
        let guess: i32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        if guess < 1 || guess > 100 {
            println!("The num must between 1 and 100");
            continue;
        }
        //...
    }
}
```

这样一个功能就是判断输入的数是否符合 i32 类型，若符合的话表达式返回 num，然后再判断是否在 1~100 之间，如果不满足则继续循环。如果有多个函数中都需要类似这样的判断，则代码便会显得冗余，我们可以自定义一个验证逻辑：

```rust
pub struct Guess {
    value: i32
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("The guess value must between 1 and 100, got {}", value);
        }

        Guess {value}
    }

    //类似 getter 方法
    pub fn value(&self) -> i32 {
        self.value
    }
}

fn guess_game() {
    loop {
        //...
        let guess = "32";
        let guess: i32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        let guess = Guess::new(guess);
    }
}
```

如果能够成功创建 Guess 实例的话，那么就说明值通过了验证，而不需要将验证功能写在函数里了。

上述 value 方法是获得 Guess 结构体中的 value 字段值，因为结构体中的字段是私有的，外部无法直接对字段赋值。