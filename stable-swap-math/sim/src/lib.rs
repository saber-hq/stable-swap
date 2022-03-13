//! Simulations of the StableSwap invariant compared to Curve's reference implementation.

use pyo3::prelude::*;
use pyo3::types::PyTuple;
use std::fs::File;
use std::io::prelude::*;

pub const MODEL_FEE_NUMERATOR: u64 = 10000000;
pub const MODEL_FEE_DENOMINATOR: u64 = 10000000000;

const DEFAULT_POOL_TOKENS: u64 = 0;
const DEFAULT_TARGET_PRICE: u128 = 1000000000000000000;
const FILE_NAME: &str = "simulation.py";
const FILE_PATH: &str = "sim/simulation.py";
const MODULE_NAME: &str = "simulation";

pub struct Model {
    pub py_src: String,
    pub amp_factor: u64,
    pub balances: Vec<u64>,
    pub n_coins: u8,
    pub target_prices: Vec<u128>,
    pub pool_tokens: u64,
}

impl Model {
    /// Constructs a new [`Model`].
    pub fn new(amp_factor: u64, balances: Vec<u64>, n_coins: u8) -> Model {
        Model::new_with_target_prices_and_pool_tokens(
            amp_factor,
            balances,
            n_coins,
            vec![DEFAULT_TARGET_PRICE, DEFAULT_TARGET_PRICE],
            DEFAULT_POOL_TOKENS,
        )
    }

    pub fn new_with_target_prices(
        amp_factor: u64,
        balances: Vec<u64>,
        target_prices: Vec<u128>,
        n_coins: u8,
    ) -> Model {
        Model::new_with_target_prices_and_pool_tokens(
            amp_factor,
            balances,
            n_coins,
            target_prices,
            DEFAULT_POOL_TOKENS,
        )
    }

    pub fn new_with_pool_tokens(
        amp_factor: u64,
        balances: Vec<u64>,
        n_coins: u8,
        pool_token_amount: u64,
    ) -> Model {
        Model::new_with_target_prices_and_pool_tokens(
            amp_factor,
            balances,
            n_coins,
            vec![DEFAULT_TARGET_PRICE, DEFAULT_TARGET_PRICE],
            pool_token_amount,
        )
    }

    pub fn new_with_target_prices_and_pool_tokens(
        amp_factor: u64,
        balances: Vec<u64>,
        n_coins: u8,
        target_prices: Vec<u128>,
        pool_token_amount: u64,
    ) -> Model {
        let src_file = File::open(FILE_PATH);
        let mut src_file = match src_file {
            Ok(file) => file,
            Err(error) => {
                panic!("{:?}\n Please run `curl -L
            https://raw.githubusercontent.com/curvefi/curve-contract/master/tests/simulation.py > sim/simulation.py`", error)
            }
        };
        let mut src_content = String::new();
        let _ = src_file.read_to_string(&mut src_content);

        Self {
            py_src: src_content,
            amp_factor,
            balances,
            n_coins,
            target_prices,
            pool_tokens: pool_token_amount,
        }
    }

    pub fn sim_d(&self) -> u128 {
        let gil = Python::acquire_gil();
        return self
            .call0(gil.python(), "D")
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_dy(&self, i: u128, j: u128, dx: u128) -> u128 {
        let gil = Python::acquire_gil();
        return self
            .call1(gil.python(), "dy", (i, j, dx))
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_exchange(&self, i: u128, j: u128, dx: u128) -> u64 {
        let gil = Python::acquire_gil();
        return self
            .call1(gil.python(), "exchange", (i, j, dx))
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_xp(&self) -> Vec<u128> {
        let gil = Python::acquire_gil();
        return self
            .call0(gil.python(), "xp")
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_y(&self, i: u128, j: u128, x: u64) -> u128 {
        let gil = Python::acquire_gil();
        return self
            .call1(gil.python(), "y", (i, j, x))
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_y_d(&self, i: u128, d: u128) -> u128 {
        let gil = Python::acquire_gil();
        return self
            .call1(gil.python(), "y_D", (i, d))
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_remove_liquidity_imbalance(&self, amounts: Vec<u128>) -> u128 {
        let gil = Python::acquire_gil();
        return self
            .call1(
                gil.python(),
                "remove_liquidity_imbalance",
                PyTuple::new(gil.python(), amounts.to_vec()),
            )
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_calc_withdraw_one_coin(&self, token_amount: u64, i: u128) -> (u64, u64) {
        let gil = Python::acquire_gil();
        return self
            .call1(gil.python(), "calc_withdraw_one_coin", (token_amount, i))
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    fn call0(&self, py: Python, method_name: &str) -> Result<PyObject, PyErr> {
        let sim = PyModule::from_code(py, &self.py_src, FILE_NAME, MODULE_NAME).unwrap();
        let model = sim
            .getattr("Curve")?
            .call1((
                self.amp_factor,
                self.balances.to_vec(),
                self.n_coins,
                self.target_prices.to_vec(),
                self.pool_tokens,
            ))
            .unwrap()
            .to_object(py);
        let py_ret = model.as_ref(py).call_method0(method_name);
        self.extract_py_ret(py, py_ret)
    }

    fn call1(
        &self,
        py: Python,
        method_name: &str,
        args: impl IntoPy<Py<PyTuple>>,
    ) -> Result<PyObject, PyErr> {
        let sim = PyModule::from_code(py, &self.py_src, FILE_NAME, MODULE_NAME).unwrap();
        let model = sim
            .getattr("Curve")?
            .call1((
                self.amp_factor,
                self.balances.to_vec(),
                self.n_coins,
                self.target_prices.to_vec(),
                self.pool_tokens,
            ))
            .unwrap()
            .to_object(py);
        let py_ret = model.as_ref(py).call_method1(method_name, args);
        self.extract_py_ret(py, py_ret)
    }

    fn extract_py_ret(&self, py: Python, ret: PyResult<&PyAny>) -> Result<PyObject, PyErr> {
        match ret {
            Ok(v) => v.extract(),
            Err(e) => {
                e.print_and_set_sys_last_vars(py);
                panic!("Python exeuction failed.")
            }
        }
    }

    pub fn print_src(&self) {
        println!("{}", self.py_src);
    }
}
