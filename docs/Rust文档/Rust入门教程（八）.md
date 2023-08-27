# Rust入门教程（八）：编写和运行测试

>这一章主要介绍 Rust 的测试。在 Rust 中，一个测试实际上就是一个函数，用于验证非测试代码的功能是否和预期一致。

>测试函数体通常执行下面三个操作，也称 `3a` 操作：
>1. 准备数据或状态（arrange）；
>2. 运行被测试的代码（act）；
>3. 断言结果（assert）。

## 一、测试的使用及演示

- 测试函数需要使用 `test` 属性（attribute）进行标注
  - attribute 就是一段代码的元数据
  - 在函数紧接着上面一行添加 `#[test]`，就将函数变成测试函数了
- 运行测试
  - 使用 `cargo test` 命令运行所有测试
    - Rust 会构建一个 Test Runner 可执行文件，会运行标注的 test 函数，并报告运行是否成功
  - 当使用 cargo 创建 library 项目时，会生成一个 test module，里面有默认的 test 函数
    - 可以添加任意数量的 test module 和 test 函数

### 1.1 测试演示

我们输入命令 `cargo new test_demo --lib` 创建一个项目，在 `lib.rs` 文件中看到这样的函数：

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}
```

这里 `assert_eq!` 是一个断言的宏，判断两个数是否相等。

然后运行 `cargo test`，结果如下：

```rust
➜  ~/code/rust/test_demo git:(master) ✗ cargo test               
   Compiling test_demo v0.1.0 (/home/cherry/code/rust/test_demo)
    Finished test [unoptimized + debuginfo] target(s) in 2.33s
     Running unittests (target/debug/deps/test_demo-357c557c333f0e0d)

running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests test_demo

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

### 1.2 测试失败

- 测试函数 panic 就表示测试失败
- 每个测试都运行在一个新线程中
- 当主线程看到测试线程挂掉后，那个测试就被标记为失败

我们单独编写一个带有 panic 的测试函数，测试结果如下：

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }

    #[test]
    fn another() {
        panic!("Test Failed!")
    }
}
```

```rust
➜  ~/code/rust/test_demo git:(master) ✗ cargo test
   Compiling test_demo v0.1.0 (/home/cherry/code/rust/test_demo)
    Finished test [unoptimized + debuginfo] target(s) in 0.28s
     Running unittests (target/debug/deps/test_demo-357c557c333f0e0d)

running 2 tests
test tests::another ... FAILED
test tests::it_works ... ok

failures:

---- tests::another stdout ----
thread 'tests::another' panicked at 'Test Failed!', src/lib.rs:11:9
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::another

test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass '--lib'
```

## 二、断言

### 2.1 使用 assert! 宏检查测试结果

- assert! 来自于标准库，用来确定某个状态是否为 true
  - 如果为 true，表示测试通过
  - 如果为 false，则调用 panic! 宏，测试失败

我们用之前写的一个小例子，判断矩形 r1 是否能容纳矩形 r2（为了简单起见，只判断正着放，而不考虑斜着放进去）。

```rust
struct Rect {
    x: u32,
    y: u32,
}

impl Rect {
    fn can_hold(&self, other: &Rect) -> bool {
        let x = if other.x > other.y { other.x } else { other.y };
        let y = if other.x < other.y { other.x } else { other.y };
        self.x > x && self.y > y
    }
}
```

测试函数：

```rust
#[test]
fn larger_can_hold_smaller() {
    let r1 = Rect { x: 12, y: 8 };
    let r2 = Rect { x: 5, y: 10 };
    assert!(r1.can_hold(&r2));
}
```

显然返回是 true，测试通过。

### 2.2 使用 assert_eq! 和 assert_ne! 测试相等性

- 都来自标准库
- 判断两个参数是否相等或不等
- 实际上，它们使用的就是 `==` 和 `!=` 运算符
- 如果断言失败，该宏会自动打印出两个参数的值
  - 使用 debug 格式打印参数
  - 要求参数实现 PartialEq 和 Debug Traits（所有基本类型和标准库里大部分类型基本都实现了）
  - 如果使用 `assert!` 宏，则只会告知测试结果而不会打印出两个参数的值

我们再写一个简单的例子，将一个数加 2，判断两个值是否相等。

```rust
fn add_two(a: i32) -> i32 {
    a + 2
}    

#[test]
pub fn it_add_two() {
    assert_eq!(4, add_two(2));
}
```

结果显然是正确的，若我们更改函数逻辑，把加 2 改成加 3，则运行测试结果为：

```rust
➜  ~/code/rust/test_demo git:(master) ✗ cargo test
   Compiling test_demo v0.1.0 (/home/cherry/code/rust/test_demo)
    Finished test [unoptimized + debuginfo] target(s) in 0.39s
     Running unittests (target/debug/deps/test_demo-357c557c333f0e0d)

running 3 tests
test tests::it_add_two ... FAILED
test tests::it_works ... ok
test tests::larger_can_hold_smaller ... ok

failures:

---- tests::it_add_two stdout ----
thread 'tests::it_add_two' panicked at 'assertion failed: `(left == right)`
  left: `4`,
 right: `5`', src/lib.rs:37:9
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace


failures:
    tests::it_add_two

test result: FAILED. 2 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass '--lib'
```

编译器将会自动给出两个参数的值（左值和右值），若将宏改成 `assert_ne!` 测试结果又将变成正确。

## 三、自定义错误消息

TODO










