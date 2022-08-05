pragma circom 2.0.6;

include "../node_modules/circomlib/circuits/poseidon.circom";

template Circuit() {
    signal input a;
    signal input b;
    signal input c;

    a === b;
    component p = Poseidon(1);
    p.inputs[0] <== c;
    p.out === 17744324452969507964952966931655538206777558023197549666337974697819074895989;
}

component main {public [a]} = Circuit();