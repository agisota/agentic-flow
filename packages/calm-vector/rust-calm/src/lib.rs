//! # CALM Vector - CPU-Only Vector Inference Engine
//!
//! Vector-only reasoning system that operates entirely in continuous space,
//! bypassing tokenization for faster, deterministic inference.

pub mod encoder;
pub mod model;
pub mod train;
pub mod metrics;

use anyhow::Result;
use candle_core::{Device, DType, Tensor};
use candle_nn::VarBuilder;
use model::NextVec;
use encoder::hash_embed;

/// Main inference engine for vector-only operations
pub struct CalmVec {
    model: NextVec,
    device: Device,
    dim: usize,
}

impl CalmVec {
    /// Create a new instance from serialized weights
    pub fn from_bytes(dim: usize, hidden: usize, bytes: &[u8]) -> Result<Self> {
        let device = Device::Cpu;
        let mut vm = candle_nn::VarMap::new();
        vm.from_bytes(bytes)?;
        let vb = VarBuilder::from_varmap(&vm, DType::F32, &device);
        let model = NextVec::new(&vb, dim, hidden)?;
        Ok(Self { model, device, dim })
    }

    /// Create a new untrained instance (random weights)
    pub fn new_untrained(dim: usize, hidden: usize) -> Result<Self> {
        let device = Device::Cpu;
        let vb = VarBuilder::from_varmap(&candle_nn::VarMap::new(), DType::F32, &device);
        let model = NextVec::new(&vb, dim, hidden)?;
        Ok(Self { model, device, dim })
    }

    /// Encode text to vector using deterministic hashing
    pub fn encode(&self, text: &str, dim: usize) -> Vec<f32> {
        hash_embed(text, dim)
    }

    /// Predict next vector given current vector
    pub fn step(&self, z: &[f32]) -> Result<Vec<f32>> {
        let zt = Tensor::from_vec(z.to_vec(), z.len(), &self.device)?;
        let out = self.model.forward(&zt)?;
        Ok(out.to_vec1::<f32>()?)
    }

    /// Multi-step prediction
    pub fn steps(&self, z: &[f32], n: usize) -> Result<Vec<Vec<f32>>> {
        let mut results = Vec::with_capacity(n);
        let mut current = z.to_vec();
        for _ in 0..n {
            current = self.step(&current)?;
            results.push(current.clone());
        }
        Ok(results)
    }

    /// Get embedding dimension
    pub fn dim(&self) -> usize {
        self.dim
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_deterministic() {
        let model = CalmVec::new_untrained(128, 256).unwrap();
        let a = model.encode("Hello world", 128);
        let b = model.encode("Hello world", 128);
        assert_eq!(a, b);
    }

    #[test]
    fn test_step_output_shape() {
        let dim = 128;
        let model = CalmVec::new_untrained(dim, 256).unwrap();
        let z = vec![0.0f32; dim];
        let out = model.step(&z).unwrap();
        assert_eq!(out.len(), dim);
    }

    #[test]
    fn test_multi_step() {
        let dim = 64;
        let model = CalmVec::new_untrained(dim, 128).unwrap();
        let z = vec![0.01f32; dim];
        let results = model.steps(&z, 3).unwrap();
        assert_eq!(results.len(), 3);
        assert_eq!(results[0].len(), dim);
    }
}
