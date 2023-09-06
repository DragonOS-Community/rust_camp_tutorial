# Rust入门教程（九）：实战演练：一个简单的 grep 程序

>本章将介绍 Rust 在实际开发中的使用，并用官方文档上的项目（一个简单版本的 grep 命令）展开讲解，最后将利用之前所学，自己实现一个代码统计的 Rust 小项目。
>要实现的 grep 命令功能很简单，就是在指定文件中查找指定文字。grep 命令接收一个文件名和字符串作为输入参数，然后读取文件内容，搜索包含指定字符串的行，最终将这些匹配的行打印输出。

下面开始实战演示。

## 一、接收命令行参数

我们预计使用如下命令来执行该程序：

```bash
cargo run <string> <filename>
```

因此我们首先要读取命令行中的参数，我们导入函数 `use std::env::args()`，`args()` 函数返回一个迭代器，迭代器部分的内容将在后面才会介绍。然后使用 `collect` 方法，将迭代器中的值转化成一个集合，但是该函数不能处理命令行中非 `Unicode` 的字符（这种情况可以使用 `env::args _os()` 函数，这种情况下返回的迭代器值的类型是 `OsString`，在这里不做介绍）。


```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    let search_string = &args[1];
    let filename = &args[2];
    println!("{:?}", args);
    println!("Search String {}", search_string);
    println!("In file {}", filename);
}
```

```rust
➜  ~/code/rust/minigrep git:(master) ✗ cargo run string filename
   Compiling minigrep v0.1.0 (/home/cherry/code/rust/minigrep)
    Finished dev [unoptimized + debuginfo] target(s) in 0.29s
     Running `target/debug/minigrep string filename`
["target/debug/minigrep", "string", "filename"]
Search String string
In file filename
```

根据程序执行结果我们能够得知：返回的第一个参数永远都是该程序的二进制文件（对应 `args[0]`），从第二个参数开始才是从命令行输入的各种参数（对应 `args[1]` ...）。

## 二、读取文件

首先导入模块 `use std::fs`，用于处理和文件相关的事务，`read_to_string()` 用来读取文件中的内容，将其转化成字符串。

```rust
use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();
    let search_string = &args[1];
    let filename = &args[2];
    println!("{:?}", args);
    println!("Search String {}", search_string);
    println!("In file {}", filename);

    let content = fs::read_to_string(filename).expect("该文件不存在");
    println!("文件内容:\n{}", content);
}
```

输出结果为：

```rust
➜  ~/code/rust/minigrep git:(master) ✗ cargo run string poem    
    Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/minigrep string poem`
["target/debug/minigrep", "string", "poem"]
Search String string
In file poem
文件内容:
Hold fast to dreams
For if dreams die
Life is a broken-winged bird
That can never fly
Hold fast to dreams
For when dreams go
Life is a barren field
Frozen only with snow

To see a world in a grain of sand,
And a heaven in a wild flower,
Hold infinity in the palm of your hand,
And eternity in an hour.
```

当然目前看来所有逻辑都放在了主函数中，并且很多错误情况都没有考虑。一般情况下一个函数只做一件事，如果代码逐渐变多，代码维护将变得越来越困难。代码越少重构越简单，因此下一节将对代码进行重构。

## 三、重构：改进模块和错误处理

### 3.1 四个问题提炼

我们仔细观察一下目前的代码，主要有四个方面的问题。

```rust
use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();
    let search_string = &args[1];
    let filename = &args[2];
    println!("{:?}", args);
    println!("Search String {}", search_string);
    println!("In file {}", filename);

    let content = fs::read_to_string(filename).expect("该文件不存在");
    println!("文件内容:\n{}", content);
}
```

1. 主函数负责的功能较多，既要负责命令行参数解析，又要负责读取文件。而程序编写的原则就是一个函数负责一个功能，因此要将主函数拆分；
2. `search_string`、`filename` 和 `content` 变量，在程序越来越大之后，变量也会越来越多，将难以追踪每一个变量的实际意义。解决办法是将这些变量放入一个结构体中，从而使其用途更加清晰；
3. 读取文件时，使用 `expect` 处理错误，但未对其读取错误的原因进行细分，因为文件打不开可能是文件不存在，文件权限不够，文件损坏等原因；
4. 对于命令行参数的错误处理，若输入的参数没有两个，那么程序本身就会报错，并且能够预料到的错误一定是 `Out of bound` 这类的错误，但是对于使用者来说，可能并不清楚这个所谓的 **越界错误** 意味着什么，无法清晰解释错误的具体原因。因此最好要将所有错误处理集中到一起，将来开发者要考虑错误处理的时候，就只要处理这一处代码，这样也能保证为用户打印出有意义的错误信息，而不是只有程序员能看懂的 `Out of bound`。

### 3.2 二进制程序关注点分离的指导性原则

- 将程序拆分为 `main.rs` 和 `lib.rs`，将业务逻辑放入 `lib.rs`
- 当命令行解析逻辑较少时，将它放在 `main.rs` 也行
- 当命令行解析逻辑变复杂时，需要将它从 `main.rs` 提取到 `lib.rs`

经过上述拆分，留在 `main` 的功能有：

- 使用参数值调用命令行解析逻辑
- 进行其它配置
- 调用 `lib.rs` 中的 `run` 函数
- 处理 `run` 函数可能出现的错误

因此放在 `main.rs` 中的代码量应足够小，小到直接阅读代码就可以确保代码的正确性。将业务逻辑放入 `lib.rs` 中也方便进行功能测试。

针对上面说的四个方面的问题，我们逐一进行解决。

**1. 拆分出命令行参数提取功能**

```rust
use std::env;
use std::fs;

fn main() {
    ... 
    let (search_string, filename) = parse_config(&args);
    ...
}
fn parse_config(args: &[String]) -> (&str, &str) {
    let search_string = &args[1];
    let filename = &args[2];
    (search_string, filename)
}
```

我们发现，`parse_config` 函数目前返回一个元组，但是在主函数中，又将该元组拆分出来，赋值给两个变量，这样感觉有点“脱裤子放屁”的感觉，来回折腾。实际上这种情况就说明程序中这样设计数据结构是不正确的。因此较好的做法就是将返回的元组中的变量放入一个结构体。

**2. 创建结构体**

```rust
struct Config {
    search_string: String,
    filename: String
}

fn parse_config(args: &[String]) -> Config {
    let search_string = &args[1];
    let filename = &args[2];
    Config { search_string, filename }
}
```

这里我们创建一个叫 `Config` 的结构体，将 `search_string` 和 `filename` 两个变量放入结构体。但是上面的代码会报错，这是因为在函数 `parse_config` 中，`args` 参数是切片类型，是没有所有权的（它的所有权被 `main` 函数拥有），而在最后要返回一个 `Config` 结构体对象，该结构体需要占用所有权，因此会报错。

这里用一个简单的方法来处理，就是创建 `args[1]` 和 `args[2]` 的两个副本，尽管这样会损失性能。

```rust
fn parse_config(args: &[String]) -> Config {
    let search_string = args[1].clone();
    let filename = args[2].clone();
    Config { search_string, filename }
}
```

我们再来看 `parse_config` 函数，它返回的是一个结构体，实际上是要创建一个新的结构体，因此我们最好再实现该结构体的 `new` 函数。

```rust
impl Config {
    fn new(args: &[String]) -> Config {
        let search_string = args[1].clone();
        let filename = args[2].clone();
        Config {
            search_string,
            filename,
        }
    }
}
```

这里就是将刚刚的 `parse_config` 变成了结构体 `Config` 的函数。重构后的完整代码如下：

```rust
use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();
    let config = Config::new(&args);
    let content = fs::read_to_string(config.filename).expect("该文件不存在");
    println!("文件内容:\n{}", content);
}

struct Config {
    search_string: String,
    filename: String,
}

impl Config {
    fn new(args: &[String]) -> Config {
        let search_string = args[1].clone();
        let filename = args[2].clone();
        Config {
            search_string,
            filename,
        }
    }
}
```

**3. 错误处理**

我们不输入参数进行运行，不出预料的会产生下面的错误：

```rust
➜  ~/code/rust/minigrep git:(master) ✗ cargo run       
warning: field is never read: `search_string`
  --> src/main.rs:19:5
   |
19 |     search_string: String,
   |     ^^^^^^^^^^^^^^^^^^^^^
   |
   = note: `#[warn(dead_code)]` on by default

warning: `minigrep` (bin "minigrep") generated 1 warning
    Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/minigrep`
thread 'main' panicked at 'index out of bounds: the len is 1 but the index is 1', src/main.rs:25:29
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

即 **越界错误**，这对于用户来说是无法理解的，我们当然可以在 `new` 函数中添加这样的判断语句，

```rust
if args.len() < 3 {
    panic!("输入参数错误，请输入两个参数。");
}
```

但是这样仍然会有编译器的其他信息，一般情况下，使用 `panic` 通常是程序本身的问题，但是像这类输入参数少的问题属于程序使用的问题，因此我们还需要进行改进，可以返回 `Result` 枚举，代码如下。

```rust
use std::env;
use std::fs;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();
    let config = Config::new(&args).unwrap_or_else(|err| {
        println!("参数解析错误：{}", err);
        process::exit(1);
    });
    let content = fs::read_to_string(config.filename).expect("该文件不存在");
    println!("文件内容:\n{}", content);
}

struct Config {
    search_string: String,
    filename: String,
}

impl Config {
    fn new(args: &[String]) -> Result<Config, &str> {
        if args.len() < 3 {
            return Err("输入参数个数不足，请输入两个参数。");
        }
        let search_string = args[1].clone();
        let filename = args[2].clone();
        Ok(Config {
            search_string,
            filename,
        })
    }
}
```

如果参数个数超过 2 个，则返回 `Err` 的变体，否则返回 `Ok`。主函数中，`unwrap_or_else` 函数的含义是，如果枚举返回的是 `Ok`，那么就取出 `Ok` 变体中的值返回，若枚举返回的是 `Err`，那么就调用一个闭包（匿名函数，闭包具体内容将来会介绍），然后使用 `process::exit(1)` 将程序返回，这样就不会有编译器的其他信息了。

```rust
➜  ~/code/rust/minigrep git:(master) ✗ cargo run
   Compiling minigrep v0.1.0 (/home/cherry/code/rust/minigrep)
    Finished dev [unoptimized + debuginfo] target(s) in 0.33s
     Running `target/debug/minigrep`
参数解析错误：输入参数个数不足，请输入两个参数。
```

**4. 功能模块化**

一个函数只处理一个功能，因此我们将业务逻辑（即读取文件内容）功能提取到一个新的函数中。

```rust
fn run(config: Config) {
    let content = fs::read_to_string(config.filename).expect("该文件不存在");
    println!("文件内容:\n{}", content);
}
```

然后我们进行 `run` 函数的错误处理。

```rust
fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let content = fs::read_to_string(config.filename)?;
    println!("文件内容:\n{}", content);
    Ok(())
}
```

这里 `result<(), Box<dyn Error>>` 中第一个参数是空，第二个参数只要理解是一个实现了 `Error` 这个 `trait` 的类型，这样函数便可以在不同场景下返回不同的错误类型。

因为 `expect` 会引起恐慌，因此将其去掉，改成 `?`，`?` 运算符遇到错误不会恐慌，它会将错误值返回给函数的调用者，如果没有发生错误，那么我们最后返回一个 `Ok()`。

这时编译器会在 `run(config)` 出给予警告：`this 'Result' may be an 'Err' variant, which should be handled`，这说明函数返回值是一个 `Result` 类型，那么就说明可能会产生错误，因此需要对其进行处理。

`unwrap` 有打开的意思，需要从 `Result` 中提取数据，但是 `run` 函数没有返回值，因此也就不需要 `unwrap`，可以像下面这样解决这一问题。

```rust
if let Err(e) = run(config) {
        println!("程序运行出错：{}", e);
        process::exit(1);
}
```

下面我们将业务逻辑迁移到 `lib.rs` 中。

`lib.rs:`

```rust
use std::fs;
use std::error::Error;

pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let content = fs::read_to_string(config.filename)?;
    println!("文件内容:\n{}", content);
    Ok(())
}

pub struct Config {
    pub search_string: String,
    pub filename: String,
}

impl Config {
    pub fn new(args: &[String]) -> Result<Config, &str> {
        if args.len() < 3 {
            return Err("输入参数错误，请输入两个参数。");
        }
        let search_string = args[1].clone();
        let filename = args[2].clone();
        Ok(Config {
            search_string,
            filename,
        })
    }
}
```

`main.rs:`

```rust
use minigrep::Config;
use std::env;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::new(&args).unwrap_or_else(|err| {
        println!("参数解析错误：{}", err);
        process::exit(1);
    });

    if let Err(e) = minigrep::run(config) {
        println!("程序运行出错：{}", e);
        process::exit(1);
    }
}
```

要记得所有函数和结构体以及字段前都要加 `pub`，这样才能让其他 `crate` 才能进行调用。这样 `lib crate` 就有了一套公共的可用于测试的 API。

重构到这里就基本完成了，下面就要来编写测试了。

## 四、使用 TDD（测试驱动开发）开发库功能

测试驱动开发 TDD (Test-Driven Development)
- 编写一个会失败的测试，运行该测试，确保它是按照预期的原因失败
- 编写或修改刚好足够的代码，让新测试通过
- 重构刚刚添加或修改的代码，确保测试会始终通过
- 返回步骤1，继续

测试驱动开发能够对代码的设计起到指导和帮助的作用，先编写测试，然后再编写能够通过测试的代码，也能保证开发过程中能够保持测试较高的覆盖率。

```rust
fn search<'a>(query: &str, content: &'a str) -> Vec<&'a str> {
    let mut vec = Vec::new();
    for lines in content.lines() {
        if lines.contains(query) {
            vec.push(lines);
        }
    }
    vec
}

#[cfg(test)]
mod test {
    #[test]
    fn one_result() {
        use super::*;
        let query = "Lakers";
        let contents = "\
Rust OK,
Paul, James, Lakers.
What a wonderful day!";
        assert_eq!(vec!["Paul, James, Lakers."], search(query, contents));
    }
}
```

注意 `search` 函数中返回的引用的生命周期与 `content` 有关，而与 `query` 无关。`content.lines()` 函数返回一个的迭代器，取出文件中的每一行。这样测试代码就完成了，运行测试也是成功的。

```rust
➜  ~/code/rust/minigrep git:(master) ✗ cargo test        
   Compiling minigrep v0.1.0 (/home/cherry/code/rust/minigrep)
    Finished test [unoptimized + debuginfo] target(s) in 0.36s
     Running unittests (target/debug/deps/minigrep-662cb87b3d895995)

running 1 test
test test::one_result ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running unittests (target/debug/deps/minigrep-33abce92ed029d2f)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests minigrep

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

然后修改 `run` 函数并运行 `cargo run`。

```rust
pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let content = fs::read_to_string(config.filename)?;
    // println!("文件内容:\n{}", content);
    for line in search(&config.search_string, &content) {
        println!("{}", line);
    }
    Ok(())
}
```

```rust
➜  ~/code/rust/minigrep git:(master) ✗ cargo run is poem 
    Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/minigrep is poem`
Life is a broken-winged bird
Life is a barren field
```

## 五、使用环境变量

这一部分使用环境变量来实现配置选项（例如是否忽略大小写等）。

我们首先编写一个测试：

```rust
#[test]
fn case_insensitive() {
    let query = "LakErS";
    let contents = "
Rust OK,
Paul, James, Lakers.
What a wonderful day!
blakers championship";
    assert_eq!(vec!["Paul, James, Lakers.", "blakers championship"], search_case_insensitive(query, contents));
}
```

然后编写 `search_case_insensitive` 函数：

```rust
fn search_case_insensitive<'a>(query: &str, content: &'a str) -> Vec<&'a str> {
    let mut vec = Vec::new();
    let query = query.to_lowercase();
    for lines in content.lines() {
        if lines.to_lowercase().contains(&query) {
            vec.push(lines);
        }
    }
    vec
}
```

其思路就是将查询的字符串和文件中的都转化成小写。

然后我们在 `run` 函数中加入如下逻辑。

```rust
let result = if config.case_sensitive {
    search(&config.search_string, &content)
} else {
    search_case_insensitive(&config.search_string, &content)
};
```

结构体的 `new` 函数也需要修改：

```rust
pub fn new(args: &[String]) -> Result<Config, &str> {
    if args.len() < 3 {
        return Err("输入参数错误，请输入两个参数。");
    }
    let search_string = args[1].clone();
    let filename = args[2].clone();
    let case_sensitive = env::var("CASE_INSENSITIVE").is_err();
    Ok(Config {
        search_string,
        filename,
        case_sensitive
    })
}
```

`env::var()` 函数返回的是 `Result` 枚举，若环境中有 `CASE_INSENSITIVE` 定义或者赋值，那么就会返回 `Ok` 中的值，我们这里只需要判断是否为 `Err` 即可。

```rust
➜  ~/code/rust/minigrep git:(master) ✗ CASE_INSENSITIVE=1 cargo run to poem
    Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/minigrep to poem`
Hold fast to dreams
Hold fast to dreams
To see a world in a grain of sand,
```

## 六、将错误消息写进标准错误而不是标准输出

当前我们都将错误信息输出到终端上，而大多数终端提供两种输出，一个是标准输出（stdout，println!），另一个叫标准错误（stderr，eprintln!）。

我们将打印错误信息的 `println!` 改成 `eprintln!` 即可，然后运行 `cargo run > output`，错误信息便不会输出到文件中，而是打印在终端了。

## 七、完整代码

**main.rs:**

```rust
use minigrep::Config;
use std::env;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::new(&args).unwrap_or_else(|err| {
        println!("参数解析错误：{}", err);
        process::exit(1);
    });

    if let Err(e) = minigrep::run(config) {
        println!("程序运行出错：{}", e);
        process::exit(1);
    }
}
```

**lib.rs:**

```rust
use std::error::Error;
use std::fs;
use std::env;

pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let content = fs::read_to_string(config.filename)?;
    // println!("文件内容:\n{}", content);
    let result = if config.case_sensitive {
        search(&config.search_string, &content)
    } else {
        search_case_insensitive(&config.search_string, &content)
    };
    for line in result {
        println!("{}", line);
    }
    Ok(())
}

pub struct Config {
    pub search_string: String,
    pub filename: String,
    pub case_sensitive: bool
}

impl Config {
    pub fn new(args: &[String]) -> Result<Config, &str> {
        if args.len() < 3 {
            return Err("输入参数错误，请输入两个参数。");
        }
        let search_string = args[1].clone();
        let filename = args[2].clone();
        let case_sensitive = env::var("CASE_INSENSITIVE").is_err();
        Ok(Config {
            search_string,
            filename,
            case_sensitive
        })
    }
}

fn search<'a>(query: &str, content: &'a str) -> Vec<&'a str> {
    let mut vec = Vec::new();
    for lines in content.lines() {
        if lines.contains(query) {
            vec.push(lines);
        }
    }
    vec
}

fn search_case_insensitive<'a>(query: &str, content: &'a str) -> Vec<&'a str> {
    let mut vec = Vec::new();
    let query = query.to_lowercase();
    for lines in content.lines() {
        if lines.to_lowercase().contains(&query) {
            vec.push(lines);
        }
    }
    vec
}

#[cfg(test)]
mod test {
    use super::*;
    #[test]
    fn one_result() {
        let query = "Lakers";
        let contents = "\
Rust OK,
Paul, James, Lakers.
What a wonderful day!";
        assert_eq!(vec!["Paul, James, Lakers."], search(query, contents));
    }

    #[test]
    fn case_insensitive() {
        let query = "LakErS";
        let contents = "
Rust OK,
Paul, James, Lakers.
What a wonderful day!
blakers championship";
        assert_eq!(
            vec!["Paul, James, Lakers.", "blakers championship"],
            search_case_insensitive(query, contents)
        );
    }
}
```

## 八、案例：代码统计

### 8.1 基本功能介绍

代码统计以给定的输入参数作为统计对象（可以是文件或文件夹），根据文件后缀名统计代码所使用的语言（暂定只统计 C、C/C++ 头文件、C++、Java、Python、Rust、汇编语言、makefile 脚本），然后统计每一种代码文件的有效代码行数、注释行和空行。没有后缀名的文件默认不进行统计。

### 8.2 可拓展功能

- 丰富统计的语言种类
- 命令行中利用参数指定要统计的语言，只统计指定的语言
- 统计若干种编程语言的有效代码行数，空行和注释
- 可以对单个文件、多个文件进行统计
- 支持一些参数，例如：排除某些文件或文件夹
- 可以对文件夹进行递归统计
- 对压缩文件包进行递归统计
- 直观展示统计结果
- 将统计结果导出为图片或 PDF
- 利用多线程加速代码统计

### 8.3 代码仓库及说明

由于笔者时间有限，目前只完成了一些简单的功能，但是完全可用。2022 年 10 月之后就没有再写了，不过后续可能会有计划再完善该项目，目前该项目的代码在 [Github仓库](https://github.com/CherryYang05/mcloc) 中，初学者可以以此巩固一下基本语法，如果有兴趣可以帮助完善一下功能，编程老鸟就可以完全不必理会这个项目（笑）。