# Rust 入门教程（四）：常用的集合

这一节介绍 Rust 中常用的几种集合类型：`Vector`，`String` 和 `HashMap`，这些集合类型都是存储在 Heap 中，不需要编译时确定大小，可以在运行时动态改变大小。


## 1. Vector

Vector 概念略，和 C++ STL 中的 Vector 差不多，下面来看使用：

**创建 Vector**

使用 `Vec::new()` 函数创建一个空 Vector，`let v: Vec<i32> = Vec::new();`（注意 V 是大写），也可以设定初始值进行创建，这时就要使用 `vec!` 宏，注意这里 v 是小写，`let v: vec![1, 2, 3];`。

**更新 Vector**

使用 `push` 方法向 vector 里添加元素

```rust
fn main() {
    let mut vec = Vec::new();

    vec.push(1);
    vec.push(2);
    vec.push(3);
    vec.push(4);
}
```

使用 `Vec::new()` 创建 vector 时，需要显式指明类型，但是若下面用 push 函数添加 vector 元素时，编译器可以根据上下文推断出类型，于是便可以不用显式指定类型了。

**删除 Vector**

与任何其它 struct 一样，当 Vector 离开作用域后，它就被清理掉了，同时它所有的元素也被清理掉了

**读取 Vector 元素**

- 索引
- get 方法

```rust
fn test01() {
    let v = vec![1, 2, 38, 4, 45];
    let third = &v[2];
    println!("The third element is {}.", third);
    match v.get(2) {
        Some(third) => println!("The third element is {}.", third),
        None => println!("There is no element in the vec."),
    }
}
```

因为 Vector 的 get 方法返回一个 Option 枚举类型，因此用 Some 和 None 做模式匹配。

但是如果用索引访问的下标越界的话，就会发生 panic，**但是使用 get 的话，会返回 None.**

**所有权和借用规则**

```rust
fn test02() {
    let v = vec![1, 12, 3, 4, 5];
    let first = &v[1];
    v.push(6);
    println!("{}", first);
}
```

上面这段代码在 `v.push();` 会报错，原因是 `first` 已经借用 v 为不可变引用，而 push 操作又将 v 变成可变的，因此会报错。

vector 之所以也有所有权和借用规则这样的机制，是因为 vector 是存储在堆中，并且数据是连续存放，如果在后面添加一个元素，而原来的内存中后面没有多余空间，则编译器将会在内存中重新寻找一块更大的内存来存放新的 vector，所以这是还是用原来 vector 的引用，就会发生错误。

实际上 C++ 中的 vector 也是这样的，但是 Rust 的语言机制从编译时就避免了，而不用等到运行时在发现错了，这也体现了 Rust 的高安全性和可靠性。下面是 C++ 中的 vector 元素首地址改变的例子，[参考博客](https://blog.csdn.net/wch0lalala/article/details/108337051)

```cpp
#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> arr;
    arr.push_back(1);
    cout << "arr's size :" << arr.size() << " capacity :" << arr.capacity() << " head address :" << arr.data() << endl;
    arr.push_back(2);
    cout << "arr's size :" << arr.size() << " capacity :" << arr.capacity() << " head address :" << arr.data() << endl;
    arr.push_back(3);
    cout << "arr's size :" << arr.size() << " capacity :" << arr.capacity() << " head address :" << arr.data() << endl;
    arr.push_back(4);
    cout << "arr's size :" << arr.size() << " capacity :" << arr.capacity() << " head address :" << arr.data() << endl;
    arr.push_back(5);
    cout << "arr's size :" << arr.size() << " capacity :" << arr.capacity() << " head address :" << arr.data() << endl;
    arr.push_back(6);
    cout << "arr's size :" << arr.size() << " capacity :" << arr.capacity() << " head address :" << arr.data() << endl;
    arr.push_back(7);
    cout << "arr's size :" << arr.size() << " capacity :" << arr.capacity() << " head address :" << arr.data() << endl;
    return 0;
}
```

输出结果为：

```cpp
arr's size :1 capacity :1 head address :0x10516fb0
arr's size :2 capacity :2 head address :0x10516e30
arr's size :3 capacity :4 head address :0x10516fb0
arr's size :4 capacity :4 head address :0x10516fb0
arr's size :5 capacity :8 head address :0x10516e30
arr's size :6 capacity :8 head address :0x10516e30
arr's size :7 capacity :8 head address :0x10516e30
```

我们发现每次 vector 扩容时元素首地址都会改变。（注意在 vector 中，&vec 和 &vec[0] 是不一样的，这是因为 vector 结构存在栈中，而 vector 的数据存在堆中，&vec 获得的只是栈中 vec 的结构的地址，始终不变，而 &vec[0] 是堆中 vector 存储的真正的元素地址，每次动态扩容后都会改变）

好我们回到 Rust。

**遍历 vector**

```rust
fn test03() {
    let v = vec![1, 2, 3, 4];
    for i in &v {
        println("{}", i);
    }
}
```

要想修改其中的值，看下面的例子：

```rust
fn test03() {
    let mut vec![1, 2, 3, 4];
    for i in &mut v {
        *i += 5;
        println("{}", i);
    }
}
```

这里 `*i` 是解引用，我们以后会介绍。

**使用 enum 来存储多种数据类型**

vector 只能存储一种数据类型，但是我们有时候想存储不同类型的数据，我们可以用可附加数据的枚举来创建 vector。

```rust
enum Spreadsheetcell {
    Int(i32),
    Float(f64),
    Text(String),
}

fn test03() {
    let v = vec![
        Spreadsheetcell::Int(3),
        Spreadsheetcell::Text(String::from("Computer Science")),
        Spreadsheetcell::Float(6.18),
    ];
}
```

使用枚举的变体就可以在 vector 中存储不同类型的数据了。

## 2. String

String 这个数据类型是所有编程语言中都非常重要的一个类型，Rust 开发者经常会被字符串困扰的原因是，Rust 倾向于暴露可能的错误，而且字符串数据结构复杂并且采用了 UTF-8 编码。

[编码类型和编码方式](#各种类型的编码)

在 Rust 中，字符串是 Byte 的集合，并且有一些方法将 byte 解析为文本。

**字符串是什么**

从 Rust 语言的核心层面上将，只有一个字符串类型，叫字符串切片 `str`，它通常以引用的形式出现（即 `&str`）。

字符串切片是对存储在其他地方，用 UTF-8 编码的字符串的引用。**字符串字面值：存储在二进制文件中，也是字符串切片**

**String 类型，来自标准库，而不是核心语言**，他可增长、可修改、可拥有，采用 UTF-8 编码，我们通常所说的字符串是指 `String` 和 `&str` 两者，而不是单指某一种。当然这里主要将的是 `String`。

**其它类型的字符串**

Rust 的标准库还包含了很多其它的字符串类型，例如：OsString，OsStr、CString、CStr
- String vs Str 后缀：拥有或借用的变体
- 可存储不同编码的文本或在内存中以不同的形式展现
- Library crate 针对存储字符串可提供更多的选项

### 2.1 字符串的创建

- 很多 `Vec<T>` 都可用于 `String`
- 利用 `String::new()` 创建字符串
- 使用初始值来创建 String：
  - `to_string()` **方法**，可用于实现了 Display trait 的类型，包括字符串字面值
  - `String::from()` **函数**，从字面值创建 String 类型

```rust
fn main() {
    let mut s1 = String::new();
    let mut s2 = String::from("Hello");
    let mut s3 = "Hello, Rust";
    let mut s4 = "Hello, Rust".to_string();
}
```

通过字符串字面值创建的 `s3` 是切片类型，其他都是 String 类型

【注】：我理解的函数就是没有 self 参数的，通过 `::` 来调用，而方法则是带有 `&self` 为其第一个参数，是通过实例来调用的，使用的是点调用的方式

### 2.2 字符串更新

- 使用 `push_str()` **方法**，把一个字符串切片附加到 String，这个方法不会获得参数的所有权
- 使用 `push()` **方法**，将一个单独的字符附加到 String 后

```rust
fn test02() {
    let mut s = String::from("Hello");
    let s1 = String::from(", Rust");
    s.push_str(&s1);
    s1.push('x');
    println!("{}", s1);
}
```

这里还是可以打印出 s1 的值，说明没有获得 s1 的所有权。

- `+` 用来连接字符串，注意加号前是**字符串类型**，后面是**字符串类型的引用**
  - 使用了类似这个签名的方法 `fn add(self, s: &str) -> String { ... }`
  - 标准库中 `add` 方法使用了泛型
  - 解引用强制转换（deref coercion）
  - 只能把 `&str` 添加到 `String`
- `format!` 用于连接多个字符串


```rust
fn test03() {
    let s1 = String::from("Hello");
    let s2 = String::from(", Rust");

    let s3 = s1 + &s2;
    println!("{}", s3);
    println!("{}", s1);
    println!("{}", s2);
}
```

上述例子中，我们发现 `s1` 不能再使用了，而 `s2` 可以再被使用，因为底层方法中使用了类似这个签名的方法 `fn add(self, s: &str) -> String { ... }`，是将字符串自身和另一个字符串的切片进行相加组合。但是 `s2` 是字符串类型，而函数参数中是字符串切片类型，不匹配，为什么代码 `let s3 = s1 + &s2;` 能够编译通过？

这是因为标准库中 `add` 方法使用了泛型，Rust 采用了一种叫 **解引用强制转换（deref coercion）** 的技术，强制将字符串类型转化成字符串切片类型，因此 `s2` 的所有权就会被保留，而 `add` 函数就会取得第一个参数的所有权，当函数调用完毕时，`s1` 的所有权就会消失。

```rust
fn test04() {
    let s1 = String::from("tic");
    let s2 = String::from("tac");
    let s3 = String::from("toc");

    // let s3 = s1 + "-" + &s2 + "-" + &s3;
    // println!("{}", s3);

    let res = format!("{}-{}-{}", s1, s2, s3);

    println!("{}", res);
}
```

上述例子中将三个字符串之间用 `-` 连接，如果代码太多显得很繁琐，采用 `format!` 宏不仅可以使得代码简单易读，更重要的是不会取得所有变量的所有权。这个宏和 `println!` 很像，只不过 `format!` 宏是将结果返回，这里可以用一个变量去接收。

### 2.3 字符串的索引

不可以按照索引的语法对 String 某部分进行访问，因为 String 类型没有实现 `Index<Integer>` trait，例如：

```rust
fn test() {
    let s = String::from("Hello");
    let s1 = s[0];  //这样是错误的
}
```

之所以无法通过索引进行访问是因为，字符串是用 UTF-8 进行编码，每一个字符都对应一个 Unicode 编码。在英文中，一个字符是 `1B`，而对于某些语言，一个字符可能对应 `2B`，而中文一个字符对应 `3B`，因此用索引进行访问的话，无法知道应该取一个字节还是两个字节。

当然 Rust 不允许通过索引进行访问的另一个原因是，索引操作理应只消耗 `O(1)` 的时间，但是为了保证不会越界，需要使用 `O(n)` 的时间进行遍历字符串长度。

**String 内部表示**

String 实际上是对 `Vec<u8>` 进行的包装，可以用 `len()` 方法获得字符串长度

字节（Bytes），标量值（Scalar Values），字形簇（Grapheme Clusters）

Rust有三种看待字符串的方式：
- 字节
- 标量值
- 字形簇（最接近所谓的“字母”）

### 2.4 切割 String

可以使用 `[]` 和 `一个范围` 来创建一个字符串的切片
- 要谨慎使用
- 如果切割时越过边界就会 panic

```rust
fn test05() {
    let hello = String::from("你好吗");
    let s = &hello[0..3];
    println!("{}", s);
}
```

上面我们说了在 Rust 中一个中文字符占 `3B`，因此我们获取字符串 hello 的前 3 个字节，输出结果为 `你`，但是要注意的是，所获取的字节必须能够构成所定义的字符，比如只获取前两字节最后运行就会报错（但是编译不会报错）。

### 2.5 遍历 String

- 对于标量值：chars() 方法
- 对于字节：bytes() 方法
- 对于字形簇，过于复杂，标准库未提供

```rust
fn test05() {
    let hello = String::from("你好吗");

    for i in hello.chars() {
        print!("{} ", i);
    }

    println!();

    for i in hello.bytes() {
        print!("{} ", i);
    }
}
```

最后输出结果为：

```rust
你 好 吗 
228 189 160 229 165 189 229 144 151
```

**String不简单**
- Rust 选择将正确处理 String 数据作为所有 Rust 程序的默认行为——程序员必须在处理 UTF-8 数据之前投入更多的精力
- 可防止在开发后期处理涉及非 ASCII 字符的错误

### 各种类型的编码

- 1967 年 ASCII，包含英文字母，阿拉伯数字，西文字符和控制字符
- 1980 年 GB2312，包含简体中文，拉丁字母和日文假名
- 1984 年 BIG5，增加了繁体字
- 1993 年 GB130001，包含了中日韩三国文字
- 1995 年 GBK，不支持韩文
- 2000 年 GB18030，兼容更多的字符

在 1994 年诞生的 Unicode 实现了编码的全球化。

那么这时候如何表示字符呢，英文所需要表示的二进制位和汉字所要表示的二进制位肯定是不同的，也就是说一个英文字符可能要占 1B，而汉字要占 2B，编码时都是将二进制连接在一起，那么怎么知道当前的一个字节所要表示的是英文还是中文呢？因此直接将每个字符用编号表示无法正确区分每个字符的边界。

一种解决方法是 **定长编码**，即每个字符都用统一长度表示，位数不够前面补 0。但是这样又出现了一个问题，一个英文字母要占两个字节，要忍受前面全是 0 的情况，只会占用更多的内存。

![定长编码](https://raw.githubusercontent.com/CherryYang05/PicGo-image/master/images/20220519005429.png)

解决方法也很简单，可以采用 **变长编码**，那么如何区分字符边界呢？其实和计组中的 **拓展操作码**，**IP 地址**，**哈夫曼编码** 都很类似，如下图所示：

![变长编码](https://raw.githubusercontent.com/CherryYang05/PicGo-image/master/images/20220519005820.png)

这就是 **UTF-8 编码**

## 3. HashMap

和各种语言中的 HashMap 一样，也是通过键值对来存储数据，通过键（Key）来寻找数据，而不是索引

### 3.1 创建 HashMap

- 创建空 HashMap：new() 函数
- 添加数据：insert() 方法

```rust
use std::collections::HashMap;

fn main() {
    let mut hash: HashMap<String, i32> = HashMap::new();
    hash.insert(String::from("Cherry"), 23);
}
```

若声明的时候没有指定类型，则必须要插入数据才不会报错，若声明时已经指定类型了，那么不用插入数据也不会报错。

- HashMap 用的较少，不在 Prelude中
- 标准库对其支持较少，没有内置的宏来创建
- HashMap 数据存储在 heap 上
- 同构的。一个 HashMap 中
  - 所有的 K 必须是同一种类型
  - 所有的 V 必须是同一种类型

**另一种创建 HashMap 的方式：collect 方法**

在元素类型为 Tuple 的 Vector 上使用 collect 方法，可以组建一个 HashMap
- 要求 Tuple 有两个值：一个作为 K，一个作为 V
- collect 方法可以把数据整合成很多种集合类型，包括 HashMap
- 返回值需要显式指明类型

```rust
fn test02() {
    let teams = vec![String::from("Suns"), String::from("Lakers")];
    let rank = vec![1, 20];
    let nba: HashMap<_, _> = teams.iter().zip(rank.iter()).collect();
}
```

使用 `collect` 时，要显式声明返回类型，因为它可以生成各种类型。

**HashMap 和所有权**

对于实现了 Copy trait 的类型（例如i32），值会被复制到 HashMap 中。对于拥有所有权的值（例如String)，值会被移动，所有权会转移给 HashMap。

如果将值的引用插入到 HashMap，值本身不会移动一在 HashMap 有效的期间，**被引用的值必须保持有效**。


```rust
fn test03() {
    let key = String::from("Suns");
    let value = String::from("Champion");
    let mut map = HashMap::new();
    map.insert(key, value);
    println!("{} {}", key, value);      //这里会报错，因为key和value所有权已经没有了

    //通常应该是这样插入数据
    map.insert(&key, &value);
}
```

这里在堆 HashMap 赋值之后，key 和 value 的所有权就被转移给了 HashMap，通常都是传入字符串的引用。

### 3.2 访问 HashMap

get方法
- 参数：K
- 返回：`Option<&V>`

```rust
fn test04() {
    let mut nba = HashMap::new();
    nba.insert("Suns".to_string(), 1);
    nba.insert("Lakers".to_string(), 20);
    let team = String::from("Suns");
    let rank = nba.get(&team);

    match rank {
        Some(s) => println!("{}", s),
        None => println!("team not exist")
    }
}
```

HashMap 的 get 方法返回的是一个 Option 枚举，并且 get 方法的参数是 String 的引用。

### 3.3 遍历 HashMap

使用 for 循环：

```rust
fn test04() {
    let mut nba = HashMap::new();
    nba.insert("Suns".to_string(), 1);
    nba.insert("Lakers".to_string(), 20);

    for (k, v) in &nba {
        println!("{}: {}", k, v);
    }
}
```

(k, v) 这里是用元组做模式匹配。

### 3.4 更新 HashMap

- HashMap 大小可变
- 每个 K 同时只能对应一个 V
- 更新 HashMap 中的数据
- K 已经存在，对应一个 V
  - 替换现有的 V
  - 保留现有的 V，忽略新的 V
  - 合并现有的 V 和新的 V
- K 不存在
  - 添加一对新的 K, V
  
**替换现有的 V**

如果向 HashMap 插入一对 (K, V)，然后再插入同样的 K，但是不同的 V，那么原来的 V 会被替换掉

```rust
fn test05() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Suns"), 115);
    scores.insert(String::from("Suns"), 132);   //覆盖
    println!("{:?}", scores);
}
```

**只在 K 不对应任何值的情况下，才插入 V**

entry方法
- 检查指定的 K 是否对应一个 V
- 参数为 K
- 返回 enum Entry：代表值是否存在

Entry 的 or_insert()方法
- 返回
  - 如果 K 存在，返回到对应的 V 的一个可变引用
  - 如果 K 不存在，将方法参数作为 K 的新值插进去，返回到这个值的可变引用

```rust
fn test05() {
    let mut scores = HashMap::new();
    scores.insert(String::from("Suns"), 115);

    scores.entry("Lakers".to_string()).or_insert(90);

    println!("{:?}", scores);
}
```

这里 `scores.entry()` 返回 Entry，如果没有值的话，会返回类似于 `Entry(VacantEntry("Lakers"))` 的枚举。

**基于现有值来更新**

```rust
fn test06() {
    let text = "What a wonderful world a a a";

    let mut map = HashMap::new();
    for word in text.split_whitespace() {
        let count = map.entry(word).or_insert(0);
        *count += 1;
    }
    println!("{:#?}", map);
}
```

最终返回结果为：

```rust
{
    "wonderful": 1,
    "world": 1,
    "a": 4,
    "What": 1,
}
```

### 3.5 Hash 函数

默认情况下，HashMap 使用加密功能强大的 Hash 函数，可以抵抗拒绝服务（DoS）攻击。
- 不是可用的最快的 Hash 算法
- 但具有更好安全性。
- 可以指定不同的 hasher 来切换到另一个函数
- hasher 是实现 BuildHasher trait 的类型
