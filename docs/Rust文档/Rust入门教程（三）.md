# Rust 入门教程（三）

**Rust 的代码组织**

代码组织主要包括：

- 哪些细节可以暴露，哪些细节是私有的一作用域内哪些名称有效
- 模块系统:
  - Package（包）：Cargo 的特性，让你构建、测试、共享 crate
  - Crate（单元包）： 一个模块树，它可产生一个 library 或可执行文件
  - Module（模块）、use：让你控制代码的组织、作用域、私有路径
  - Path（路径）：为 struct、function 或 module 等项命名的方式


## 1. Package 和 Crate

Crate的类型:
- binary
- library

Crate Root:
- 是源代码文件
- Rust编译器从这里开始，组成你的 Crate 的根Module

一个 Package:
  - 包含 1 个 Cargo.toml，它描述了如何构建这些 Crates 
  - 只能包含 0-1 个 library crate
  - 可以包含任意数量的 binary crate
  - 但必须至少包含一个 crate (library 或 binary)

**Cargo 的惯例**

`src/main.rs`:
- binary crate 的 crate root
- crate 名与 package 名相同

`src/lib.rs`:
- package 包含一个 library crate
- library crate 的 crate root
- crate 名与 package 名相同

Cargo 把 crate root 文件交给 rustc 来构建 library 或 binary

如果 package 下有一个lib.rs，就说明 package 下面有一个 library crate，这个 lib.rs 就是这个 library crate 的入口文件，crate 名字也是叫 my-project.

一个 Package 可以同时包含 src/main.r s和 src/lib.rs
- 一个 binary crate，一个 library crate
- 名称与 package 名相同

一个 Package 可以有多个 binary crate:
- 文件放在 src/bin
- 每个文件是单独的 binary crate

**Crate 的作用**

将相关功能组合到一个作用域内，便于在项目间进行共享，防止冲突。例如 rand crate，访问它的功能需要通过它的名字:rand

**定义 module 来控制作用域和私有性**

Module:
- 在一个crate内，将代码进行分组
- 增加可读性，易于复用
- 控制项目（item）的私有性。public、private

建立 module:
- mod 关键字
- 可嵌套
- 可包含其它项（struct、enum、常量、trait、函数等）的定义

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
        fn seat_at_table() {}
    }
    
    mod serving {
        fn take_order() {}
        fn serve_order() {}
        fn take_payment() {}
    }
}
```

![crate树形结构](https://raw.githubusercontent.com/CherryYang05/PicGo-image/master/images/20220514204827.png)

`src/main.rs` 和 `src/lib.rs` 叫做 `crate roots`:
- 这两个文件（任意一个）的内容形成了名为 crate 的模块，位于整个模块树的根部
- 整个模块树在隐式的crate模块下


## 2. 路径(Path)

为了在 Rust 的模块中找到某个条目，需要使用路径。路径的两种形式:
- 绝对路径:从 crate root开始，使用 crate 名或字面值 crate
- 相对路径:从当前模块开始，使用 self，super 或当前模块的标识符路径至少由一个标识符组成，标识符之间使用`::`

**私有边界（privacy boundary）**

- 模块不仅可以组织代码，还可以定义私有边界
- 如果想把函数或结构体设为私有，可以将它放到某个模块中
- Rust中所有的条目（函数，方法，struct，enum，模块，常量）默认是私有的
- 父级模块无法访问子模块中的私有条目
- 子模块里可以使用所有祖先模块中的条目

**Pub 关键字**

使用 `pub` 关键字将某些条目标记为公共的，同为根下的模块尽管都是私有，也可以访问

**super 关键字**

用来访问父级模块路径中的内容，类似文件系统中的 `..`，例子如下：

```rust
mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::serve_order();
        crate::serve_order();
    }

    fn cook_order() {}
}
fn serve_order() {}
```

**pub struct**

pub 放在 struct 前:
- struct 是公共的
- struct 的字段默认是私有的
- struct 的字段需要**单独设置** pub 来变成公有

```rust
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,
        fruit: String,
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                fruit: String::from("strawberry"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    let mut meal = back_of_house::Breakfast::summer("Rye");
    println!("I'd like {} toast please.", meal.toast);
}
```

**pub enum**

pub 放在 enum 前:
- enum 是公共的
- **enum 的变体也都是公共的**

```rust
mod back_of_house {
    pub enum Appetizer {
        Soup,
        Salad
    }
}
```

## 3. use 关键字

可以使用 `use` 将路径导入到作用域内，同样遵循私有性原则，即只有公共的才能被使用

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
        fn some_function() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
    hosting::some_function();   //报错，因为some_function为私有
}
```

使用 `use` 指定相对路径：`use front_of_house::hosting;`

可以直接将模块中的函数导入到作用域内，但是这样便无法区分该函数是在模块中定义还是在该文件内定义，因此通常的做法都是只导入到该函数的父模块，通过父模块调用函数。

对于函数和同名条目是这样，但是对于结构体和枚举，通常是指定完整路径，这是 `use` 的习惯用法。

```rust
use std::fmt;
use std::io;

fn f1() -> fmt::Result {}

fn f2() -> io::Result {}
```

**as 关键字**

`as` 关键字可以为引入的路径指定一个本地的别名，例子如下：

```rust
use std::fmt::Result;
use std::io::IOResult;

fn f1() -> Result {}
fn f2() -> IOResult {}
```

**使用 pub use 重新导出名称**

使用 use 将路径（名称）导入到作用域内后，该名称在此作用域内是私有的

pub use:重导出
- 将条目引入作用域
- 该条目可以被外部代码引入到它们的作用域

`pub use crate::front_of_house::hosting;`

**使用外部包**

1. Cargo.toml 添加依赖的包(package)
   - https://crates.io/
2. use 将特定条目引入作用域

标准库（std）也被当做外部包，但是不需要修改 Cargo.toml 来包含 std，需要使用 use 将 std 中的特定条目引入当前作用域

```rust
use std::collections::HashMap;
```

**使用嵌套路径清理大量 use 语句**

如果使用同一个包或模块下的多个条目，可以使用嵌套路径在同一行内将上述路径进行引入

格式如下：`路径相同的部分::{路径不同的部分}`，例子如下：

```rust
use std::cmp::Ordering;
use std::io;

//使用嵌套路径
use std::{cmp::Ordering, io};

//若是这样的引用
use std::io;
use std::io::Write;

//简写为
use std::io::{self, Write};
```

**通配符\***

使用 `*` 可以把路径中所有的公共条目都引入到作用域

`use std::collections::*;`

应用场景:
- 测试。将所有被测试代码引入到 tests 模块
- 有时被用于预导入（prelude）模块

## 4. 将模块拆分为不同文件

**将模块内容移动到其它文件**

模块定义时，如果模块名后边是 `;`，而不是代码块，Rust 会从与模块同名的文件中加载内容，同时项目文件夹结构要与模块层级结构一致。随着模块的变大，该技术可以把模块中的内容移动到其他文件中。

例如：文件 `main.rs`:

```rust
pub mod back_of_house;
```

文件 `back_of_house.rs`:

```rust
pub mod hosting;
```

这时必须在 `src` 下创建一个 `back_of_house` 的文件夹，里面创建一个 `hosting.rs` 文件，即为 `src/back_of_house/hosting.rs`

文件 `hosting.rs`:

```rust
pub fn test() {}
```
