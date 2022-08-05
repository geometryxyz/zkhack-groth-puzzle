pragma circom 2.0.6;

template Circuit() {
    signal input a;
    signal input b;
    signal input c;
    signal input d;

    35*b === (2*a + 2*d + c + 2) * (d + 4);
    656*b === (8*d + 8) * (6*a + 16 + 3*c + 16*d);
    2100*b === (2*a + 32 + c) * (64 - d - 2*a - c);
    1 === d * d;
}

component main {public [a, b]} = Circuit();