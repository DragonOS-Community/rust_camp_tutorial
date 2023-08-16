# Rust入门教程（七）：生命周期

>Rust 生命周期机制是与所有权机制同等重要的资源管理机制。生命周期，简而言之就是引用的有效作用域，之所以引入这个概念主要是应对复杂类型系统中资源管理的问题。引用是对待复杂类型时必不可少的机制，毕竟复杂类型的数据不能被处理器轻易地复制和计算，但引用往往导致极其复杂的资源管理问题。

## 生命周期

- Rust 的每个引用都有自己的生命周期
- 生命周期：引用保持有效的作用域
- 大多数情况：生命周期是隐式的、可被推断的
- 当引用的生命周期可能以不同的方式互相关联时：手动标注生命周期

生命周期的主要目标：避免悬垂引用（dangling reference）

```rust
fn test01() {
    {
        let r;
        {
            let x = 3;
            r = &x;
        }
        println!("{}", r);
    }
}
```

上面这段代码会在 `r = &x;` 处报错，因为当打印 `r` 的值的时候，`x` 已经离开了他的作用域，这时 `r` 指向的 `x` 的内存已经被释放，因此会报错。

Rust 实际上是通过**借用检查器**来检查一些变量的生命周期。

### 借用检查器

Rust 编译器的借用检查器（borrow checker），用来比较作用域来判断所有的借用是否合法

在上例中，借用检查器检测到 `r` 的生命周期大于 `x`，即被引用者的生命周期小于引用者的生命周期，因此编译会报错。

### 函数中的泛型生命周期

```rust
fn test02() {
    let string1 = String::from("Congratulations");
    let string2 = "fantastic";
    let result = longest(string1.as_str(), string2);
    println!("The longest string is {}", result);
}

fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

编译报错：

```rust
➜  ~/Code/rust/life_cycle git:(master) ✗ cargo run           
   Compiling life_cycle v0.1.0 (/home/cherry/Code/rust/life_cycle)
error[E0106]: missing lifetime specifier
  --> src/main.rs:24:33
   |
24 | fn longest(x: &str, y: &str) -> &str {
   |               ----     ----     ^ expected named lifetime parameter
   |
   = help: this function's return type contains a borrowed value, but the signature does not say whether it is borrowed from `x` or `y`
help: consider introducing a named lifetime parameter
   |
24 | fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
   |           ++++     ++          ++          ++

For more information about this error, try `rustc --explain E0106`.
```

我们发现编译器会提示**缺少一个命名的生命周期参数**，这个函数返回一个借用的值，但是没有声明这个借用的值是来自 `x` 还是来自 `y`。值得说明的是，这个返回值的借用跟函数体的逻辑没有关系，要从函数签名就要看出返回值借用的值来自哪一个参数。

根据编译器提示，我们声明一个泛型生命周期 `'a`，代码修改如下：

```rust
fn longest<'a> (x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

### 生命周期标注语法

- 生命周期的标注不会改变引用的生命周期长度
- 当指定了泛型生命周期参数，函数可以接收带有任何生命周期的引用
- 生命周期的标注：描述了多个引用的生命周期间的关系，但不影响生命周期

生命周期参数名语法如下：
- 以 `'` 开头
- 通常全小写且非常短
- 习惯以 `'a` 表示

生命周期标注的位置：

- 在引用符号 `&` 后面标注
- 使用空格将标注和引用类型区分开

生命周期标注的例子：

```rust
&i32        // 一个引用
&'a i32     // 带有显式生命周期的引用
&'a mut i32 // 带有显式生命周期的可变引用
```

值得注意的是，单个生命周期标注本身没有意义，我们再看上面的 `longest` 函数：

```rust
fn longest<'a> (x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

泛型的生命周期参数声明在函数名和参数列表之间的 `<>` 中。

我们仔细分析这个函数：

`longest` 函数的两个参数都声明了生命周期，就要求这两个引用必须和泛型的生命周期存活相同的时间，而且函数所返回的字符串切片的存活时长也不能小于 `'a` 这个生命周期。为引用指明生命周期，是要确保当引用失去了所有权后而被移出内存。当在函数参数中指明生命周期时，我们并没有改变参数和返回值的生命周期，只是向调用检查器指出了一些可用于检查非法调用的约束。而 `longest` 函数本身并不需要知道参数 `x` 和 `y` 具体的存活时长，只需要某个可以代替 `'a` 的作用域，同时满足函数的签名约束。实际上，若函数引用其外部的代码或者被外部代码引用，只靠 rust 本身确定参数和返回值的生命周期时不可能的，这样的话，函数所使用的生命周期在每次调用中都会发生变化，正因为如此，我们才需要手动对生命周期进行标注。

当我们将两个引用传入函数时，`x` 和 `y` 作用域重叠的部分将用来代替 `'a` 这个生命周期的作用域，换句话说，这个泛型生命周期得到的具体的生命周期就是 `x` 和 `y` 两者生命周期较短的那个，因为返回值也标注了相同的生命周期，因此返回值的引用在两者比较短的生命周期内都是有效的。

那么生命周期标注是如何对 `longest` 函数进行限制的？我么修改一下代码：

```rust
fn test02() {
    let string1 = String::from("Congratulations");
    {
        let string2 = "fantastic";
        let result = longest(string1.as_str(), string2);
        println!("The longest string is {}", result);
    }
}

fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

将 string1 下面三行代码放到一个单独的作用域里，string2 是一个字符串字面值（字符串切片），他的生命周期相当于是一个静态的生命周期，在整个程序运行期间都存活，而 result 引用也会在 Line 7 大括号结束之前保持有效，因此代码不会报错。

【注】：`&str` 是直接在可执行文件中加载的，即这块内存直接放到可执行文件里面的，所以整个程序运行期间，这块内存比较特殊，不会由于所有权而消失，所以指这块内存的引用，一定会一直指向一个合法内存，所以其引用的生命周期是 `'static`，也就是全局静态，也不可能出现什么悬垂引用。

再改一下代码，将 result 声明放到外面，然后将 print 也放到外面，将 string2 改成 String 类型：

```rust
fn test02() {
    let string1 = String::from("Congratulations");
    let result;
    {
        let string2 = String::from("fantastic");
        result = longest(string1.as_str(), string2.as_str());
    }
    println!("The longest string is {}", result);
}
```

我们发现 Line 6 报错了。string1 的生命周期为 Line 2~9，string2 的生命周期为 Line 5~7，所以 `'a` 所表示的生命周期为 Line 5~7，而 result 的生命周期为 Line 3~9，不在 `'a` 的范围内，因此编译报错，我们来看一下编译具体的错误：

```rust
➜  ~/Code/rust/life_cycle git:(master) ✗ cargo run
   Compiling life_cycle v0.1.0 (/home/cherry/Code/rust/life_cycle)
error[E0597]: `string2` does not live long enough
  --> src/main.rs:30:44
   |
30 |         result = longest(string1.as_str(), string2.as_str());
   |                                            ^^^^^^^^^^^^^^^^ borrowed value does not live long enough
31 |     }
   |     - `string2` dropped here while still borrowed
32 |     println!("The longest string is {}", result);
   |                                          ------ borrow later used here

For more information about this error, try `rustc --explain E0597`.
error: could not compile `life_cycle` due to previous error
```

这个报错的含义是，为了让 result 这个变量在打印时是有效的，那么 string2 必须在外部作用域结束之前一直保持有效，因为在函数声明中参数和返回值都使用了相同的生命周期。

在上例中，尽管 string1 的长度大于 string2 的长度，函数返回的是 string1 的引用，但是编译器并不知道这一点，编译器只知道 `longest` 函数返回引用的生命周期是 `x` 和 `y` 生命周期比较短的那个。

## 深入理解生命周期

- 指定生命周期参数的方式依赖于函数所做的事情，在上面的例子中，若 `longest` 函数改为：

```rust
fn longest(x: &str, y: &str) -> &str {
    x
}
```

这个时候，函数只返回变量 `x`，而与 `y` 无关，因此无需为 `y` 指定生命周期。

- 从函数返回引用时，返回类型的生命周期参数需要与其中一个参数的生命周期匹配
- 如果返回的引用没有指向任何参数，那么他只能引用函数内创建的值
  - 这就是**悬垂引用**，该值在函数结束时就走出了作用域，见下面的例子

```rust
fn test02() {
    let string1 = String::from("Congratulations");
    let string2 = "fantastic";
    let result = longest(string1.as_str(), string2);
    println!("The longest string is {}", result);
}

fn longest<'a> (x: &'a str, y: &'a str) -> &'a str {
    let res = String::from("abc");
    res.as_str()
}
```

上面的代码中，`longest` 函数中返回了局部变量 `res`，当函数执行完毕时，局部变量 `res` 所指向的内存已经被释放掉，因此 `test02` 中的 `result` 变量指向的 `res` 内存已经被清理，这就造成了**悬垂引用**，非常类似于 `C/C++` 的野指针。

那么我就是想返回函数中的局部变量，应该怎么办呢？解决办法也很简单，就是直接返回这个值而不是返回引用，这样就将变量的所有权移交出去了，如下所示：

```rust
fn longest<'a> (x: &'a str, y: &'a str) -> String {
    let res = String::from("abc");
    res
}
```

**因此从根本上讲，生命周期这种语法规则，是用来关联函数的不同参数及返回值之间的生命周期，一旦他们取得了某种联系，rust 就会获得足够的信息来支持保证内存安全的操作，并且阻止那些可能会导致悬垂指针或者其他违反内存安全的行为。**

## Struct 定义中的生命周期标注

struct 里可以包括：
- 自持有类型（类似于 i32 等）
- 引用：需要在每个引用上添加生命周期标注

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn test04() {
    let novel = String::from("Today is Tuesday. And I will take part in a meeting.");

    let first_sentence = novel.split(".").next().expect("Can't find a '.'");
    let i = ImportantExcerpt {
        part: first_sentence,
    };
}
```

## 生命周期的省略

每个引用都有生命周期，需要为使用生命周期的函数或 struct 指定生命周期参数

但是下面这个例子，没有任何生命周期的标注，仍然可以通过编译：

```rust
fn first_word(s: &str) -> &str {
    let byte = s.as_bytes();
    for (i, &item) in byte.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}
```

按照原来的 rust 规范，函数声明、参数和返回类型前都是要加上生命周期标注的，但是 rust 团队发现程序员总是一遍又一遍地标注同样的生命周期，而且这些场景是可以预测的，有着明确的模式，因此 rust 团队就将这些模式写入了编译器，使得借用检查器可以自动对这些模式进行推导而无需显式标注。

**生命周期省略规则**

- 在 Rust 引用分析中所编入的模式称为**生命周期省略规则**
  - 这些规则无需开发者来遵守
  - 它们是一些特殊情况，由编译器来考虑
  - 如果你的代码符合这些情况，那么就无需显式标注生命周期
- 生命周期省略规则不会提供完整的推断：
  - 如果应用规则后，引用的生命周期仍然模糊不清→编译错误
  - 解决办法：添加生命周期标注，表明引用间的相互关系


### 输入、输出生命周期

生命周期在：
- 函数/方法的参数中，叫做输入生命周期
- 函数/方法的返回值中，叫输出生命周期

### 生命周期省略的三个规则

编译器使用三个规则在没有显式标注生命周期的情况下，来确定引用的生命周期
- 规则 1 应用于输入生命周期
- 规则 2、3 应用于输出生命周期
- 如果编译器应用完三个规则后，仍然无法确定有效的生命周期，则报错
- 这些规则适用于 fn 和 impl 块

**规则 1：** 每个引用类型都有自己的生命周期
**规则 2：** 如果只有 1 个输入生命周期参数，那么该生命周期被赋给所有输出生命周期参数
**规则 3：** 如果有多个输入生命周期参数，但其中一个是 `&self` 或 `&mut self`，那么 `self` 的生命周期会被赋给所有的输出生命周期参数

**生命周期省略的三个规则-例子**

假设我们是编译器:

`fn first_word(s: &str) -> &str {}`
`fn first_word<'a>(s: &'a str) -> &str {}`
`fn first_word<'a>(s: &'a str) -> &'a str {}`

`fn longest(x: &str, y: &str) -> &str {}`
`fn longest<'a, 'b>(x: &'a str, y: &'b str) -> &str {}`

### 方法定义中的生命周期标注

- 在 struct 上使用生命周期实现方法，语法和泛型参数的语法一样
- 在哪声明和使用生命周期参数，依赖于：
  - 生命周期参数是否和字段、方法的参数或返回值有关
- struct 字段的生命周期名：
  - 在 impl 后声明
  - 在 struct 名后使用
  - 这些生命周期是 struct 类型的一部分
- impl 块内的方法签名中
  - 引用必须绑定于 struct 字段引用的生命周期，或者引用是独立的也可以
  - 生命周期省略规则经常使得方法中的生命周期标注不是必须的

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> u32 {
        3
    }

    fn printSome(&self, words: &str) -> &str {
        println!("There are some words: {}", self.part);
        self.part
    }
}
```

## 静态生命周期

- `'static` 是一个特殊的生命周期：整个程序的持续时间
  - 例如：所有的字符串字面值都拥有 `'static` 生命周期
    - `let s: &'static str = "I have a static lifetime.";`
    - 字符串字面值是存在二进制程序中，总是可用
- 为引用指定 `'static` 之前要三思
  - 是否需要引用在整个生命周期内都存活

### 一个泛型参数类型，Trait Bound 和生命周期的综合例子

```rust
use std::fmt::Display;

fn longest_with_an announcement<'a,T>
    (x: &'a str, y: &'a str, ann: T) -> 'a str
where
    T: Display,
{
    println! ("Announcement! {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

**要注意的是，生命周期也是泛型的一种。**