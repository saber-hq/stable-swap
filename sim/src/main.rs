// TODO: Remove this
use sim::Model;

fn main() {
    let balances = vec![1, 1];
    let m = Model::new(100, balances, 2);
    let props = m.get_properties();
    println!(
        "A: {}, n: {}, fee: {}, p: {:?}, x: {:?}",
        props.A, props.n, props.fee, props.p, props.x
    );
    println!("D: {}", m.sim_d());
    println!("xp: {:?}", m.sim_xp());
    println!("y: {:?}", m.sim_y(0, 1, 2));
}
