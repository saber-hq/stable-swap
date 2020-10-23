use pyo3::prelude::*;
use pyo3::types::PyTuple;
use std::fs::File;
use std::io::prelude::*;

const FILE_NAME: &str = "simulation.py";
const MODULE_NAME: &str = "simulation";

pub const MODEL_FEE_NUMERATOR: u64 = 1;
pub const MODEL_FEE_DENOMINATOR: u64 = 1000;

pub struct Model {
    py_src: String,
    amp_factor: u64,
    balances: Vec<u64>,
    n_coins: u64,
}

pub struct Properties {
    pub A: u64,
    pub n: u64,
    pub fee: u64,
    pub p: Vec<u64>,
    pub x: Vec<u64>,
    // tokens: Vec<u64>,
}

impl Model {
    pub fn new(amp_factor: u64, balances: Vec<u64>, n_coins: u64) -> Model {
        let src_file = File::open("sim/simulation.py");
        let mut src_file = match src_file {
            Ok(file) => file,
            Err(error) => {panic!("{:?}\n Please run `curl -L https://raw.githubusercontent.com/curvefi/curve-contract/master/tests/simulation.py > sim/simulation.py`", error)}
        };
        let mut src_content = String::new();
        let _ = src_file.read_to_string(&mut src_content);
        Self {
            py_src: src_content,
            amp_factor: amp_factor,
            balances: balances,
            n_coins: n_coins,
        }
    }

    pub fn get_properties(&self) -> Properties {
        let gil = Python::acquire_gil();
        let py = gil.python();
        let sim = PyModule::from_code(py, &self.py_src, FILE_NAME, MODULE_NAME).unwrap();
        let model = sim
            .call1(
                "Curve",
                (self.amp_factor, self.balances.to_vec(), self.n_coins),
            )
            .unwrap();
        Properties {
            A: model
                .getattr("A")
                .unwrap()
                .to_object(py)
                .extract(py)
                .unwrap(),
            n: model
                .getattr("n")
                .unwrap()
                .to_object(py)
                .extract(py)
                .unwrap(),
            fee: model
                .getattr("fee")
                .unwrap()
                .to_object(py)
                .extract(py)
                .unwrap(),
            p: model
                .getattr("p")
                .unwrap()
                .to_object(py)
                .extract(py)
                .unwrap(),
            x: model
                .getattr("x")
                .unwrap()
                .to_object(py)
                .extract(py)
                .unwrap(),
        }
    }

    pub fn sim_d(&self) -> u64 {
        let gil = Python::acquire_gil();
        return self
            .call0(gil.python(), "D")
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_dy(&self, i: u64, j: u64, dx: u64) -> u64 {
        let gil = Python::acquire_gil();
        return self
            .call1(gil.python(), "dy", (i, j, dx))
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_exchange(&self, i: u64, j: u64, dx: u64) -> u64 {
        let gil = Python::acquire_gil();
        return self
            .call1(gil.python(), "exchange", (i, j, dx))
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_xp(&self) -> Vec<u64> {
        let gil = Python::acquire_gil();
        return self
            .call0(gil.python(), "xp")
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_y(&self, i: u64, j: u64, x: u64) -> u64 {
        let gil = Python::acquire_gil();
        return self
            .call1(gil.python(), "y", (i, j, x))
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_y_d(&self, i: u64, d: u64) -> u64 {
        let gil = Python::acquire_gil();
        return self
            .call1(gil.python(), "y_D", (i, d))
            .unwrap()
            .extract(gil.python())
            .unwrap();
    }

    pub fn sim_remove_liquidity_imbalance(&self, amounts: Vec<u64>) -> u64 {
        unimplemented!("sim_remove_liquidity_imbalance not implemented")
    }

    pub fn sim_calc_withdraw_one_coin(&self, token_amount: u64, i: u64) -> u64 {
        unimplemented!("sim_remove_liquidity_imbalance not implemented")
    }

    fn call0(&self, py: Python, method_name: &str) -> Result<PyObject, PyErr> {
        let sim = PyModule::from_code(py, &self.py_src, FILE_NAME, MODULE_NAME).unwrap();
        let model = sim
            .call1(
                "Curve",
                (self.amp_factor, self.balances.to_vec(), self.n_coins),
            )
            .unwrap()
            .to_object(py);
        let py_ret = model.as_ref(py).call_method0(method_name);
        return self.extract_py_ret(py, py_ret);
    }

    fn call1(
        &self,
        py: Python,
        method_name: &str,
        args: impl IntoPy<Py<PyTuple>>,
    ) -> Result<PyObject, PyErr> {
        let sim = PyModule::from_code(py, &self.py_src, FILE_NAME, MODULE_NAME).unwrap();
        let model = sim
            .call1(
                "Curve",
                (self.amp_factor, self.balances.to_vec(), self.n_coins),
            )
            .unwrap()
            .to_object(py);
        let py_ret = model.as_ref(py).call_method1(method_name, args);
        return self.extract_py_ret(py, py_ret);
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
