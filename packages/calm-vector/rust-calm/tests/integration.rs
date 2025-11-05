use calm_vec::{CalmVec, encoder, metrics};

#[test]
fn test_full_workflow() {
    let dim = 128;
    let model = CalmVec::new_untrained(dim, 256).unwrap();

    // Encode
    let v1 = model.encode("hello world", dim);
    let v2 = model.encode("goodbye world", dim);

    assert_eq!(v1.len(), dim);
    assert_eq!(v2.len(), dim);
    assert_ne!(v1, v2);

    // Predict
    let next = model.step(&v1).unwrap();
    assert_eq!(next.len(), dim);

    // Multi-step
    let trajectory = model.steps(&v1, 5).unwrap();
    assert_eq!(trajectory.len(), 5);
}

#[test]
fn test_cosine_similarity() {
    let v1 = encoder::hash_embed("machine learning", 128);
    let v2 = encoder::hash_embed("machine learning", 128);
    let v3 = encoder::hash_embed("deep learning", 128);

    let sim_same = encoder::cosine_similarity(&v1, &v2);
    let sim_diff = encoder::cosine_similarity(&v1, &v3);

    assert!((sim_same - 1.0).abs() < 1e-5);
    assert!(sim_diff < sim_same);
}

#[test]
fn test_metrics() {
    let pred = vec![1.0, 2.0, 3.0];
    let target = vec![1.1, 2.1, 3.1];

    let mse = metrics::mse_vec(&pred, &target);
    assert!(mse < 0.1);

    let sim = metrics::cosine_similarity(&pred, &target);
    assert!(sim > 0.99);
}

#[test]
fn test_retrieval_metrics() {
    let retrieved = vec![
        "doc1".to_string(),
        "doc2".to_string(),
        "doc3".to_string(),
        "doc4".to_string(),
    ];
    let relevant = vec![
        "doc1".to_string(),
        "doc3".to_string(),
        "doc5".to_string(),
    ];

    let p1 = metrics::precision_at_k(&retrieved, &relevant, 1);
    let p3 = metrics::precision_at_k(&retrieved, &relevant, 3);
    let r5 = metrics::recall_at_k(&retrieved, &relevant, 5);

    assert!((p1 - 1.0).abs() < 1e-5); // doc1 is relevant
    assert!((p3 - 0.666).abs() < 0.01); // 2 out of 3
    assert!((r5 - 0.666).abs() < 0.01); // found 2 out of 3 relevant
}
