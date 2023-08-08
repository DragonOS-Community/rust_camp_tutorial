# Rust入门教程（一）

## Rust基本介绍

>Rust 语言是一种高效、可靠的通用高级语言。其高效不仅限于开发效率，它的执行效率也是令人称赞的，是一种少有的兼顾开发效率和执行效率的语言。    ——来自菜鸟教程

>高性能 - Rust 速度惊人且内存利用率极高。由于没有运行时和垃圾回收，它能够胜任对性能要求特别高的服务，可以在嵌入式设备上运行，还能轻松和其他语言集成。
>可靠性 - Rust 丰富的类型系统和所有权模型保证了内存安全和线程安全，让您在编译期就能够消除各种各样的错误。
>生产力 - Rust 拥有出色的文档、友好的编译器和清晰的错误提示信息，还集成了一流的工具——包管理器和构建工具，智能地自动补全和类型检验的多编辑器支持， 以及自动格式化代码等等。


## 一、变量与可变性

声明变量用 `let` 关键字，默认情况下该变量是不可变的(immutable)

声明变量时在前面添加一个 `mut` 关键字，便可以使得该关键字可以被修改

### 变量与常量

常量(constant)在绑定值之后也是不可变的，但是它与不可变变量有很多区别：

- 不可以使用 `mut` 修饰，常量永远都是不可变的
- 声明常量用 `const` 关键字，它的类型必须被标注
- 常量可以在任何作用域内被声明，包括全局作用域
- 常量只可以绑定到常量表达式，无法绑定到函数的调用结果或只能在运行时才能计算出的值

在程序运行期间，常量在其声明的作用域内一直有效.

命名规范：Rust 中使用全大写字符，每个单词之间用下划线分隔，例如：`MAX_NUM`。一个声明的例子：`const MAX_NUM: u32 = 100_000`。（注：数字中也可以添加下划线增强数字的可读性）

### Shadowing

可以使用相同的名字声明新的变量，新的变量会 `Shadowing(隐藏)` 之前声明的同名变量。

`shadow` 和把变量标记为 `mut` 是不一样的：

- 如果不使用 `let` 关键字，那么重新给非 `mut` 变量赋值就会编译错误
- 而使用 `let` 声明的新变量，也是不可变的
- 使用 `let` 声明的同名变量，**类型可以改变**

例：
```rust
let string = "STRING";
let string = string.len();
```

这样将字符串提取出他的长度，而不用单独再开一个新的变量。

## 二、数据类型

`Rust` 是静态语言，在编译时必须知道所有变量的类型

- 基于使用的值，编译器通常能够推断出他的具体类型
- 但是如果可能的类型很多，（比如 `String` 转为整数的 `parse` 方法）那么就要添加类型的标注，否则会报错

### 标量类型

一个标量类型代表一个单独的值

一共有 **整数类型，浮点类型，布尔类型，字符类型** 四种类型

**整数类型：**

没有小数部分，如 `u32`，`i32`，`i64`等，表格如下：

|Length|Signed|Unsigned|
|---|---|---|
|8-bit   |  i8  |  u8  |
|16-bit  |  i16 |  u16 |
|32-bit  |  i32 |  u32 |
|64-bit  |  i64 |  u64 |
|arch    | isize| usize|

其中 `isize` 和 `usize` 由计算机架构的位数所决定，主要使用场景是对某种集合进行索引操作

除了 `byte` 类型外，所有数值的字面值都可以加上类型后缀，例如：`58u8`。其中 `Rust` 中整数默认值为 `i32`

**整数溢出**

将一个 `u8` 类型的值设置为 `256`，在调试模式下编译会发生 `panic`，但是在发布模式(--release)下，编译器不会检查可能导致 `panic` 的溢出，如果溢出，将会执行 “环绕”，即 256 为 0，257 为 1，不会导致 `panic`

**浮点类型：**

包含 `f32`（单精度） 和 `f64`（双精度）两种浮点类型，统一采用 `IEEE-754` 标准。

浮点类型的默认类型为 `f64`.

**数值操作：**

和其他语言一致

**布尔类型：**

布尔类型有 `true` 和 `false` 两个值，占用 1 字节，符号是 `bool`

**字符类型：**

`Rust` 语言中使用 `char` 来表示单个字符，字符的字面值采用单引号，占用 4 字节大小，是 `Unicode` 的标量值，可以表示比 `ASCII` 码多得多的内容，例如中文，日文，emoji表情等

`Unicode` 标量值的范围是从 `U+0000` 到 `U+D7FF`，`U+E0000` 到 `U+10FFFF`

但 Unicode 中没有字符的概念，所以直觉上认为的字符也许与 `Rust` 中的概念并不相符

### 复合类型

复合类型可以将多个值放在一个类型里

Rust 提供了两种基础的复合类型：元组（Tuple），数组

**Tuple**

Tuple 可以将多个类型的多个值放在一个类型里

Tuple 长度是固定的，一旦声明就无法改变

创建和调用举例：

```rust
let tup:(u32, i64, f32) = (2022, -461, 6.2);
println!("{}, {}, {}", tup.0, tup.1, tup.2);
```

**数组**

数组是在栈（Stack）上分配的单个块的内存

数组也可以将多个值放在一个类型里，但是数组中每个元素类型必须一致，数组长度也是固定，一旦声明不能改变

创建和调用举例：

```rust
let a = [1, 2, 3, 4, 5];
println!("{}", arr[2]);
```

如果想将数据存放在栈中而不是堆中，或者想保留固定数量的元素，可以使用数组。

当然如果希望数组长度变得灵活，可以使用 `vector`

**数组的类型**

用 `[类型; 长度]` 这样的形式表示

例

```rust
let a: [i32; 5] = [1, 2, 3, 4, 5];
```

若数组中元素都相同，则有另一种声明数组的方法：

```rust
let a = [3; 5];
//这就相当于
let a = [3, 3, 3, 3, 3];
```

在中括号里先指定初始值，然后是分号，然后是元素个数。

使用索引来访问数组元素，如果访问的索引超过数组范围，编译会通过，运行时会报错，**但是 Rust 中不允许继续访问越界的地址**（在 C 语言中是允许的，只不过会输出乱码）

## 三、函数

声明函数使用 `fn` 

依照惯例，针对函数和变量名，Rust 使用 `snake case` 命名规范
- 所有字母都是小写，单词之间用下划线隔开
- Rust 的函数调用不按照声明顺序执行，即在后面声明的函数也可以在前面调用（这点与 C 语言不同）

**函数的参数**

parameter（定义函数的参数），arguments（调用函数的参数）

必须声明每个参数的类型


**函数体中的语句和表达式**

- 语句 `statement` 和表达式 `expression`
- 函数体由一系列语句组成，可选的由一个表达式结束
- Rust 是一个基于表达式的语言
- 语句是执行一些动作的指令
- 表达式会计算产生一个值
- 函数的定义也是语句
- 语句不返回值，因此不能用 let 将一个语句赋值个一个变量

```rust
let y = {
        let x = 4;
        x + 2       
    };

    println!("y = {}", y);
```

这里 let y 后面定义了一个代码块，这个块就是一个表达式，`x + 2` 后面没有分号，是一个表达式，相当于这个块表达式的返回值，因此最后输出的结果为 `y = 6`.

而如果 `x + 2` 后面加了分号，这就是一个语句了，语句返回一个空的元组，即返回 `()`，则输出一个空的元组将会报错

**函数的返回值**

在 `->` 符号后面声明函数返回值的类型，但是不可以为返回值命名

在 Rust 中，返回值通常就是函数体中最后一个表达式的值（大多数函数都是默认使用最后一个表达式作为返回值）

若想提前返回，需要使用 `return` 关键字，并指定一个值

```rust
fn main {
    let x = plus_five(12);
    println!("The function return a num {}", x);
}

fn plus_five(x: i32) -> i32 {
    x + 5
}
```

**条件判断**

只有一点说明：`if` 条件判断中表达式**必须**是 `bool` 类型，（C 语言等语言可以将类型转成 bool 再判断，Rust 中不可以）

当使用了超过一个 `else-if` 时，最好使用 `match` 语句进行重构。例：

```rust
fn condition_match() {
    let x = 3;
    match x % 4 {
        4 => println!("The number {} can be divided by 4", x),
        3 => println!("The number {} can be divided by 3", x),
        2 => println!("The number {} can be divided by 2", x),
        _ => println!("The number {} can't be divided by 4; 3 and 2", x)    //_ 表示 default
    }
}
```

**在 let 语句中使用 if**

因为 `if` 是一个表达式，因此可以将其放在 `let` 语句等号的右边

```rust
let condition = true;
let x = if condition { 5 } else { 6 };
println!("{}", x);
```

最后返回 x 的值为 5

## 四、 控制流

Rust 提供三种循环：`loop`、`while` 和 `for`

### loop循环

loop 关键字将反复执行一块代码，直到手动停止，或者使用 `break` 停止

```rust
fn branch() {
    let mut counter = 1;
    let x = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2
        }
    };
    println!("The value of counter is {}", x);
}
```

最后输出结果为 20

### while循环

```rust
fn fn_while() {
    let mut number = 3;
    while number != 0 {
        println!("{}!", number);
        number = number - 1;
    }
    println!("MOVE! NOW!");
}
```

### for循环

```rust
fn fn_for() {
    let a = [10, 11, 12, 13, 14];
    for elem in a.iter() {
        println!("The value is {}", elem);
    }
}
```

**使用 for 循环实现 while 循环**

`Range` 由标准库提供，指定一个开始数字和结束数字，`Range` 可以生成他们之间的一个数字（左闭右开），`rev` 方法可以翻转 `Range`。例：

```rust
fn fn_range_for() {
    for elem in (1..4).rev() {
        println!("{}!", elem);
    }
    println!("Go!");
}
```

## *五、所有权

### 所有权和堆栈

所有权是 Rust 中最独特的特性，它让 Rust 无需 GC 就可以保证内存安全。

**什么是所有权**

- Rust 的核心就是所有权
- 所有程序在运行时都必须管理它们使用计算机内存的方式
  - 有些语言有垃圾收集机制(GC)，在程序运行时，它们会不断寻找不再使用的内存
  - 在其他例如 C/C++ 语言中，程序员必须显式地分配和释放内存
- Rust 采用了第三种方式
  - 内存是通过一个所有权系统来管理的，其中包含一组编译器在编译时检查的规则
  - 当程序运行时，所有权特性不会减慢程序的运行速度，因为 Rust 对内存的管理相关的工作都提前到了编译时

**堆内存和栈内存**

- 所有存储在 Stack 上的数据必须拥有已知的固定的大小
- 编译时大小未知的数据或运行时大小可能发生变化的数据必须存放在 Heap 上
- Heap 的分配和 C 语言类似，在内存空间中找到一块足够大的空间，然后返回一个指针。这叫做“分配”
- 把值压到 Stack 上不叫“分配”
- 将值压到 Stack 上比在 Heap 上快得多，因为操作系统不需要找用来存储数据的空间，那个位置永远在 Stack 最顶端

**访问数据**

- 访问 Heap 的速度比 Stack 慢，因为要通过指针才能找到
- 在 Heap 上分配大量空间也是需要很多时间的

**所有权解决的问题**

- 跟踪代码的哪些部分正在使用 Heap 的哪些数据
- 最小化 Heap 上的重复数据量
- 清理 Heap 上未使用的空间以避免空间不足

**所有权规则**

- 每个值都有一个变量，这个变量是这个值的所有者
- 每个值同时只能拥有一个所有者
- 当所有者超出作用域(Scope)时，该值将被删除

**String**

- 在 Heap 上分配，能够存储在编译时未知数量的文本
- 使用 `from` 函数从字符串字面值创建出 `String` 类型
- `let s = String::from("Cherry");`
- 这类字符串是可以被修改的

```rust
fn main() {
    let mut s = String::from("Hello");
    s += ", Rust";
    s.push_str(", Rust");
    println!("{}", s);
}
```

- 字符串字面值，在编译时就知道它的内容了，其文本内容直接被硬编码到最终的可执行文件里——速度快、高效。是因为其不可变性。
- String类型，为了支持可变性，需要在 heap 上分配内存来保存编译时未知的文本内容:操作系统必须在运行时来请求内存。这步通过调用`String:from` 来实现
- 当用完String 之后，需要使用某种方式将内存返回给操作系统这步，在拥有 GC 的语言中，GC 会跟踪并清理不再使用的内存。没有 GC，就需要我们去识别内存何时不再使用，并调用代码将它返回。―如果忘了，那就浪费内存。
  - 如果提前做了，变量就会非法
  - 如果做了两次，也是 Bug。必须一次分配对应一次释放

但是 Rust 采用了不同的方式：对于某个值来说，当拥有它的变量走出作用域时，内存会自动交还给操作系统

`drop` 函数，当变量走出作用域时，会调用这个函数

**变量与数据交互的方式：Move**

- String 的组成由三部分组成：指向数据的指针、长度和容量

- 这些数据放在 Stack 中
- 字符串数据存放在 Heap 中
- 长度 len，就是存放字符串内容所需的字节数
- 容量 capacity 指的是 String 从系统中获得内存的总字节数

![String的组成](https://raw.githubusercontent.com/CherryYang05/PicGo-image/master/images/20220511181243.png)

当把 s1 赋值给 s2 时，String 的数据被复制了一份，这实际上只复制了指针、长度和容量这一数据，在堆中的数据并没有被复制。

![String浅拷贝](https://raw.githubusercontent.com/CherryYang05/PicGo-image/master/images/20220511202210.png)

因此当变量离开作用域的时候，Rust 会自动调用 drop 函数，并将变量使用的 heap 内存释放掉。而在 s1 和 s2 都离开作用域的时候，它们都会尝试释放相同的内存，这时就出现了严重的`二次释放(double free)bug`

为了保证内存安全，Rust 中没有尝试复制堆中被分配的内存，Rust 让 s1 失效：当 s1 离开作用域的时候，Rust 不需要释放任何东西

当 s2 创建之后再使用 s1 的效果由下例展示：

```rust
fn test02() {
    let s1 = String::from("Owner of Rust#");
    let s2 = s1; 
    println!("{}", s1);
}
```

当创建 s2 之后，将 s1 的值赋值给 s2 之后，编译器会报如下的错：

```rust
➜  ~/Code/rust/owner git:(master) ✗ cargo run
   Compiling owner v0.1.0 (/home/cherry/Code/rust/owner)
warning: unused variable: `s2`
  --> src/main.rs:22:9
   |
22 |     let s2 = s1;
   |         ^^ help: if this is intentional, prefix it with an underscore: `_s2`
   |
   = note: `#[warn(unused_variables)]` on by default

error[E0382]: borrow of moved value: `s1`
  --> src/main.rs:24:20
   |
20 |     let s1 = String::from("Owner of Rust#");
   |         -- move occurs because `s1` has type `String`, which does not implement the `Copy` trait
21 | 
22 |     let s2 = s1;
   |              -- value moved here
23 |     
24 |     println!("{}", s1);
   |                    ^^ value borrowed here after move
   |
   = note: this error originates in the macro `$crate::format_args_nl` (in Nightly builds, run with -Z macro-backtrace for more info)

For more information about this error, try `rustc --explain E0382`.
warning: `owner` (bin "owner") generated 1 warning
error: could not compile `owner` due to previous error; 1 warning emitted
```

也许这跟浅拷贝（shadow copy）比较类似，但是 Rust 同时还让 s1 失效了，因此用一个新的术语 `move` 来形容。同时 Rust 也隐含了一个设计原则：即 Rust 不会自动创建数据的深拷贝，通俗的说就是一块内存只能有一个变量进行操作。就运行时性能而言，任何自动赋值操作都是廉价的。

**变量与数据交互的方式：Clone**

要想对 heap 上面的数据进行深拷贝，可以使用 `clone` 方法，`clone` 是 `copy` 子集。例子如下：

```rust
fn test02() {
    let s1 = String::from("Owner of Rust#");
    let s2 = s1.clone; 
    println!("{}", s1);
}
```

Stack上的数据:复制

- Copy trait，可以用于像整数这样完全存放在stack上面的类型
- 如果一个类型实现了 Copy 这个 trait，那么旧的变量在赋值后仍然可用
- 如果一个类型或者该类型的一部分实现了 Drop trait，那么 Rust 不允许让它再去实现 Copy trait 了

标准库文档里有说，std::ops::Drop 这个 trait 与 Copy_trait 无法共存于一个类型，因为在 Move 时，若发生 Copy 行为，Copy 行为是隐式的，因为是隐式的，编译器很难预测什么时候调用 Drop 函数，而实现了 Clone_trait 的，因为 clone 是显式的，需要 a.clone() 这样，那么编译器就能通过这种显式的 clone，确定被 clone 的变量的位置，决定何时调用 drop 函数。

**一些拥有 Copy trait 的类型**

- 任何简单标量的组合类型都可以是 Copy 的
- 任何需要分配内存或某种资源的都不是 Copy 的
- 一些拥有 Copy trait 的类型:–所有的整数类型
  - 例如 u32-bool
  - char
  - 所有的浮点类型，例如 f64
  - Tuple(元组），如果其所有的字段都是 Copy 的
    - (i32, i32) 是
    - (i32, String) 不是

```rust
fn test02() {
    let s1 = String::from("Owner of Rust#");
    take_ownership(s1);
    println!("{}", s1);     //报错，因为 s1 被 take_ownership 调用过后就会释放掉
    let x = 20;
    makes_copy(x);
    println!("{}", x);
}

fn take_ownership(string: String) {
    println!("{}", string);
}

fn makes_copy(num: u32) {
    println!("{}", num);
}
```

**返回值与作用域**

函数在返回值的过程中也会发生所有权的转移，下面的例子可以很好的帮助理解所有权这一概念：

```rust
fn test03() {
    let s1 = give_ownership();

    let s2 = String::from("Rust");

    let s3 = take_and_give_ownership(s2);
}

fn give_ownership() -> String {
    let string = String::from("$Rust$");
    string
}

fn take_and_give_ownership(string: String) -> String {
    string
}
```

其中 s2 在函数 `take_and_give_ownership` 调用后，所有权转移到了函数中，随着函数执行完，s2 的所有权也没有了。实际上函数的作用就是获得 s2 的所有权，然后这个所有权又返回给了 s3.

一个变量的所有权总是遵循同样的模式:
- 把一个值赋给其它变量时就会发生移动
- 当一个包含 heap 数据的变量离开作用域时，它的值就会被drop 函数清理，除非数据的所有权移动到另一个变量上

那么如何让函数使用某个值，而不获得其所有权？例子如下：

```rust
fn test04() {
    let s1 = String::from("Welcome!");

    let (s2, len) = calc_len(s1);

    println!("The string {}'s length is {}.", s2, len);
}

fn calc_len(str: String) -> (String, usize) {
    let len = str.len();
    (str, len)
}
```

我们将 s1 作为参数传递进去，返回一个包含 String 和 usize 类型的元组，这样就将 s1 的所有权转移给了 s2。

那么如果不要传递参数能做到吗？下一节进行介绍。

### 引用与借用

```rust
fn test05() {
    let s = String::from("引用与借用");
    let len = calc_len_2(&s);
    println!("The string {}'s length is {}.", s, len);
}

fn calc_len_2(str: &String) -> usize {
    str.len()
}
```

- 参数类型是 `&String` 而不是 `String`
- `&`就表示引用，允许引用某些值而不得到其所有权

![引用](https://raw.githubusercontent.com/CherryYang05/PicGo-image/master/images/20220512190841.png)

注：Rust 中解引用的符号和 C/C++ 中是一样的，都是 `*`.

- 把引用作为函数参数的行为就叫**借用**
- 和变量一样，引用也是默认不能被修改的
- 若要使其能够修改，需要加上 `mut` 关键字

例子如下：

```rust
fn test05() {
    let mut s = String::from("引用");
    let len = calc_len_2(&mut s);
    println!("The string {}'s length is {}.", s, len);
}

fn calc_len_2(str: &mut String) -> usize {
    str.push_str("与借用");
    str.len()
}
```

若修改了一个引用对象，则会报这样的错误：

`cannot borrow *str as mutable, as it is behind a & reference`

**可变引用**

可变引用有一个重要的限制:在特定作用域内，对某一块数据，只能有一个可变的引用。
- 这样做的好处是可在编译时防止数据竞争

以下三种行为下会发生数据竞争:
- 两个或多个指针同时访问同一个数据一至少有一个指针用于写入数据
- 没有使用任何机制来同步对数据的访问
- 可以通过创建新的作用域，来允许非同时的创建多个可变引用

例：

```rust
fn test06() {
    let mut s = String::from("Hello");
    let s1 = &mut s;
    let s2 = &mut s;
    println!("{}, {}", s1, s2);
}
```

这里 s1 和 s2 同时对可变变量 s 进行了引用，就会报这样的错误：`cannot borrow s as mutable more than once at a time`

通过创建新的作用域，可以允许非同时的创建多个可变引用

```rust
fn test06() {
    let mut s = String::from("Hello");
    {
        let s1 = &mut s;
    }
    let s2 = &mut s;
}
```

**另一个限制**

- 不可以同时拥有一个可变引用和一个不变的引用（因为不可变引用的作用就是不让值改变，被可变引用改变后，不可变引用就失去了其作用）
- 多个不变的引用是可以的

```rust
fn test06() {
    let mut s = String::from("Hello");
    let s2 = &s;
    let s3 = &s;
    let s4 = &mut s;    //报错
    println!("{} {} {}", s2, s3, s4);
}
```

这样便会报错：`cannot borrow s as mutable because it is also borrowed as immutable`

**悬空引用 Dangling References**

悬空指针（Dangling Pointer): 一个指针引用了内存中的某个地址，而这块内存可能已经释放并分配给其它人使用了。
- 在Rust里，编译器可保证引用永远都不是悬空引用
- 如果你引用了某些数据，编译器将保证在引用离开作用域之前数据不会离开作用域

```rust
fn test07() {
    let r = dangle();
}

fn dangle() -> &String {
    let s = String::from("Dangling reference");
    &s
}
```
程序在 `dangle` 函数中声明了一个字符串，期望返回其的引用，但是函数结束后 s 便离开了他的作用域，即被销毁，因此返回的引用为空。这和 C 语言中返回局部变量的地址如出一辙，但是 Rust 在编译时就将避免这样的问题发生。

报错：`missing lifetime specifier`

**引用的规则**

在任何给定的时刻，只能满足下列条件之一:一个可变的引用，或者任意数量不可变的引用，而且引用必须一直有效。

## 六、切片

Rust 的另一种不持有所有权的数据类型：切片（Slice）

下面编写这样一个函数进行示范：

- 它接收字符串作为参数
- 返回它在这个字符串里找到的第一个单词
- 如果函数没有找到任何空格，则返回整个字符串

```rust
fn main() {
    let mut s = String::from("Hello World");
    let space_index = first_word(&s);
    s.clear();
    println!("The first blank's position is in {}.", space_index);
}

fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();
    /*
        byte 的 iter 方法会为数组 byte 创建一个迭代器，这个方法会依次返回集合中的每个元素
        enumerate 方法会将 iter 返回的结果进行包装，并把每个结果作为一个元组的一部分进行返回
        元组的第一个元素就是遍历的索引，第二个元素就是数组中的元素（是一个引用），这里实际用到的是模式匹配
        声明了两个变量对这个元组进行解构
    */
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        }
    }
    s.len()
}
```

实际上这个函数的设计有一个缺陷，这个函数是将字符串空格的索引位置返回，而一旦这个结果脱离了这个字符串的上下文，这个返回值便没有了意义。换句话说，这个索引位置的结果是独立于字符串而存在的，在函数返回以后，我们就再也无法保证其有效性。举个例子，若函数获取 `Hello World` 这个字符串的空格位置，获取到函数返回值为 `5` 后，将该字符串清空 `s.clear()`，但是此时函数返回值 `space_index` 的值仍然是 `5`，这跟现在的字符串便没有了任何关联，因此这个返回值便没有了意义了。这样的 API 需要关注两者之间的同步性，但是往往都会比较繁琐。

Rust 提供了切片类型用来解决这一问题。

**字符串切片**

字符串切片是指向字符串中一部分内容的引用

形式：[开始索引..结束索引]，前闭后开

![字符串切片](https://raw.githubusercontent.com/CherryYang05/PicGo-image/master/images/20220513022342.png)

切片是放在 stack 上，右边的数组是放在 heap 上的。

*【更正】：s 切片的长度和容量应该为 11.*

```rust
fn main() {
    let mut s = String::from("Hello World");
    let hello = &s[0..5];
    let world = &s[6..11];
}
```

这里切片有三个语法糖，若切片的开始位置为 0，则可以省略写，若切片的末尾时字符串最后一个位置，即等于字符串长度，那么也可以省略不写，下面的例子和上面是等价的：

```rust
fn main() {
    let mut s = String::from("Hello World");

    let hello = &s[..5];
    let world = &s[6..];
    let whole = &s[..];

    println!("{}, {}", hello, world);   //输出为 Hello, World
    println!("{}", whole);              //输出为 Hello World
}
```

**注意：**

- 字符串切片的范围索引必须发生在有效的 `UTF-8` 字符边界内。

- 如果尝试从一个多字节的字符中创建字符串切片，程序会报错并退出

下面用切片重写上面的函数：

```rust
fn main() {
    let mut s = String::from("Hello World");
    let space_index_slice = first_word_slice(&s);
    s.clear();                                      //报错
    println!("The first world is {}.", space_index_slice);
}

fn first_word_slice(s: &String) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[..i];
        }
    }
    &s[..]
}
```

这里函数返回 `&str` 表示字符串切片，若找到空格，将返回该位置之前的字符串切片，否则返回整个字符串切片。

但是上述代码中 `s.clear()` 会报错，报错信息为:

```rust
error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
  --> src/main.rs:7:5
   |
5  |     let space_index_slice = first_word_slice(&s);
   |                                              -- immutable borrow occurs here
6  | 
7  |     s.clear();
   |     ^^^^^^^^^ mutable borrow occurs here
...
13 |     println!("The first blank's position is in {}.", space_index_slice);
   |                                                      ----------------- immutable borrow later used here

For more information about this error, try `rustc --explain E0502`.
error: could not compile `slice` due to previous error
```

即不能将变量 s 借用为可变，因为它已经被借用为不可变。在函数参数中用了不可变引用，但是下面 `s.clear()` 又要修改字符串的值，使其变成可变，这样便会报错。

**字符串字面值是切片**

- 字符串字面值被直接存储在二进制程序中
- `let s = "Hello, World!";`
- 变量 s 的类型是 `&str`，它是一个指向二进制程序特定位置的切片
- `&str` 是不可变引用，所以字符串字面值也是不可变的

**将字符串切片作为参数传递**

有经验的 Rust 开发者会采用 `&str` 作为参数类型，因为这样就可以同时接收 `String` 和 `&str` 类型的参数了

- 使用字符串切片，直接调用该函数
- 使用 `String`，可以创建一个完整的 `String` 切片来调用该函数
- 定义函数时使用字符串切片来代替字符串引用会使我们的 API 更加通用，且不会损失任何功能

```rust
fn first_word(s: &str) -> &str {
    //TODO
}
```

**其他类型的切片**

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];
    let slice = &a[1..3];
    println!("{}", slice[1]);
}
```

这个切片类型为 `&[i32]`，它存储了一个指向起始元素的位置的指针，还存储了一个长度，该例中为 `2`
