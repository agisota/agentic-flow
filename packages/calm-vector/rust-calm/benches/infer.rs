use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use calm_vec::CalmVec;

fn bench_encode(c: &mut Criterion) {
    let mut group = c.benchmark_group("encode");

    for dim in [128, 256, 384, 512].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(dim), dim, |b, &dim| {
            let model = CalmVec::new_untrained(dim, dim * 2).unwrap();
            let text = "The quick brown fox jumps over the lazy dog";
            b.iter(|| {
                black_box(model.encode(black_box(text), dim))
            });
        });
    }
    group.finish();
}

fn bench_predict(c: &mut Criterion) {
    let mut group = c.benchmark_group("predict");

    for dim in [128, 256, 384, 512].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(dim), dim, |b, &dim| {
            let model = CalmVec::new_untrained(dim, dim * 2).unwrap();
            let z = vec![0.01f32; dim];
            b.iter(|| {
                black_box(model.step(black_box(&z)).unwrap())
            });
        });
    }
    group.finish();
}

fn bench_multi_step(c: &mut Criterion) {
    let mut group = c.benchmark_group("multi_step");

    let dim = 384;
    let model = CalmVec::new_untrained(dim, 768).unwrap();
    let z = vec![0.01f32; dim];

    for steps in [1, 5, 10, 20].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(steps), steps, |b, &steps| {
            b.iter(|| {
                black_box(model.steps(black_box(&z), steps).unwrap())
            });
        });
    }
    group.finish();
}

criterion_group!(benches, bench_encode, bench_predict, bench_multi_step);
criterion_main!(benches);
